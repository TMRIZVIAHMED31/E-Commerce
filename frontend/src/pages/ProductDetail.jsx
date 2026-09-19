import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { apiOrigin } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const imageUrl = (image) => (image?.startsWith('/') ? `${apiOrigin}${image}` : image);

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => setError('Product not found'));
  }, [id]);

  const startChat = async () => {
    try {
      const { data } = await api.post('/chat/conversations', {
        sellerId: product.seller._id,
        productId: product._id,
      });
      navigate(`/chat/${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start chat');
    }
  };

  const addProduct = async (buyNow = false) => {
    const result = await addToCart(product, quantity);
    setCartMessage(result.message || `${quantity} item${quantity === 1 ? '' : 's'} added to cart.`);
    if (result.success && buyNow) navigate('/cart');
  };

  if (error) return <div className="container">{error}</div>;
  if (!product) return <div className="container">Loading...</div>;

  const isOwnProduct = user && user._id === product.seller?._id;

  return (
    <div className="container narrow">
      <img
        src={imageUrl(product.image) || 'https://via.placeholder.com/500x300?text=Product'}
        alt={product.name}
        className="detail-img"
      />
      <h2>{product.name}</h2>
      <p className="price">${Number(product.price).toFixed(2)}</p>
      <p>{product.description}</p>
      <p className="muted">Category: {product.category}</p>
      <p className="muted">In stock: {product.stock}</p>
      <p className="muted">Sold by: {product.seller?.name}</p>

      <div className="purchase-panel">
        <label className="quantity-control">
          Quantity
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            disabled={product.stock < 1}
            onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock, Number(event.target.value) || 1)))}
          />
        </label>
        <div className="purchase-actions">
          <button disabled={product.stock < 1} onClick={() => addProduct()}>🛒 Add to Cart</button>
          <button className="buy-now" disabled={product.stock < 1} onClick={() => addProduct(true)}>⚡ Buy Now</button>
        </div>
        {cartMessage && <p className="cart-message" role="status">{cartMessage}</p>}
      </div>

      {user && user.role === 'user' && (
        <button onClick={startChat}>Chat with seller</button>
      )}
      {!user && <p className="muted">Login as a buyer to chat with the seller.</p>}
      {isOwnProduct && <p className="muted">This is your own product listing.</p>}
    </div>
  );
}
