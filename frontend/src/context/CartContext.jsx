import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const applyCartResponse = (data, setItems, setCartGroups) => {
  if (Array.isArray(data?.carts)) {
    setCartGroups(data.carts);
    setItems([]);
    return;
  }

  setItems(data?.items || []);
  setCartGroups([]);
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cartGroups, setCartGroups] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');

  useEffect(() => {
    if (!user) {
      setItems([]);
      setCartGroups([]);
      setCartError('');
      return;
    }

    let active = true;
    setCartLoading(true);
    setCartError('');
    api.get('/cart')
      .then(({ data }) => {
        if (!active) return;
        applyCartResponse(data, setItems, setCartGroups);
        setCartError('');
      })
      .catch((err) => {
        if (active) {
          setCartError(err.response?.data?.message || 'Could not connect to the cart service.');
        }
      })
      .finally(() => {
        if (active) setCartLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const addToCart = async (product, requestedQuantity = 1) => {
    if (user?.role !== 'user') return { success: false, message: 'Login as a buyer to add items.' };

    try {
      const { data } = await api.post('/cart', {
        productId: product._id,
        quantity: requestedQuantity,
      });
      applyCartResponse(data, setItems, setCartGroups);
      setCartError('');
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not add item to cart.' };
    }
  };

  const updateQuantity = async (productId, requestedQuantity, userId) => {
    try {
      const { data } = await api.put(`/cart/${productId}`, {
        quantity: requestedQuantity,
        ...(userId ? { userId } : {}),
      });
      applyCartResponse(data, setItems, setCartGroups);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not update cart.' };
    }
  };

  const removeFromCart = async (productId, userId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`, {
        params: userId ? { userId } : undefined,
      });
      applyCartResponse(data, setItems, setCartGroups);
    } catch {
      // Keep the current cart visible when a remove request fails.
    }
  };

  const cartCount = useMemo(
    () => (cartGroups.length
      ? cartGroups.reduce(
        (total, cart) => total + cart.items.filter((item) => item.product).length,
        0
      )
      : items.filter((item) => item.product).length),
    [items, cartGroups]
  );

  return (
    <CartContext.Provider value={{ items, cartGroups, cartCount, cartLoading, cartError, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

