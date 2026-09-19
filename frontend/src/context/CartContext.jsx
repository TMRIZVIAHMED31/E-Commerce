import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const storageKey = 'shopmern-cart';

const readCart = () => {
  try {
    const savedCart = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(savedCart) ? savedCart : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, requestedQuantity = 1) => {
    const quantity = Number(requestedQuantity);
    const stock = Number(product.stock) || 0;
    const existingItem = items.find((item) => item.product._id === product._id);
    const nextQuantity = (existingItem?.quantity || 0) + quantity;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return { success: false, message: 'Choose at least one item.' };
    }
    if (stock < 1) {
      return { success: false, message: 'This product is out of stock.' };
    }
    if (nextQuantity > stock) {
      return {
        success: false,
        message: `Only ${stock} ${stock === 1 ? 'item is' : 'items are'} available.`,
      };
    }

    setItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.product._id === product._id);
      if (currentItem) {
        return currentItems.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity, product }
            : item
        );
      }
      return [...currentItems, { product, quantity }];
    });
    return { success: true };
  };

  const updateQuantity = (productId, requestedQuantity) => {
    const quantity = Number(requestedQuantity);
    const item = items.find((cartItem) => cartItem.product._id === productId);
    if (!item) return { success: false, message: 'Cart item not found.' };
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { success: false, message: 'Quantity must be at least one.' };
    }
    if (quantity > item.product.stock) {
      return { success: false, message: `Only ${item.product.stock} available.` };
    }

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.product._id === productId ? { ...currentItem, quantity } : currentItem
      )
    );
    return { success: true };
  };

  const removeFromCart = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item.product._id !== productId));
  };

  const cartCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, cartCount, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);