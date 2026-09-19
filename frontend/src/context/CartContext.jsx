import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (user?.role !== 'user') {
      setItems([]);
      return;
    }

    let active = true;
    api.get('/cart')
      .then(({ data }) => {
        if (active) setItems(data.items || []);
      })
      .catch(() => {
        if (active) setItems([]);
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

  const updateQuantity = async (productId, requestedQuantity) => {
    try {
      const { data } = await api.put(`/cart/${productId}`, { quantity: requestedQuantity });
      setItems(data.items || []);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not update cart.' };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setItems(data.items || []);
    } catch {
      // Keep the current cart visible when a remove request fails.
    }
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

