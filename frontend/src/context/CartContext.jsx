import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [cartGroups, setCartGroups] = useState([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setCartGroups([]);
      return;
    }

    let active = true;
    api.get('/cart')
      .then(({ data }) => {
        if (!active) return;
        if (data.carts) {
          setCartGroups(data.carts);
          setItems([]);
        } else {
          setItems(data.items || []);
          setCartGroups([]);
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
          setCartGroups([]);
        }
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
      setItems(data.items || []);
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
      setItems(data.items || []);
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
      if (data.carts) setCartGroups(data.carts);
      else setItems(data.items || []);
    } catch {
      // Keep the current cart visible when a remove request fails.
    }
  };

  const cartCount = useMemo(
    () => (cartGroups.length
      ? cartGroups.reduce(
        (total, cart) => total + cart.items.reduce((cartTotal, item) => cartTotal + item.quantity, 0),
        0
      )
      : items.reduce((total, item) => total + item.quantity, 0)),
    [items, cartGroups]
  );

  return (
    <CartContext.Provider value={{ items, cartGroups, cartCount, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

