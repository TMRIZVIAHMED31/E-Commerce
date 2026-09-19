import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiOrigin } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const imageUrl = (image) => (image?.startsWith('/') ? `${apiOrigin}${image}` : image);

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [message, setMessage] = useState('');

  const handleAddToCart = async () => {
    const result = await addToCart(product);
    setMessage(result.success ? 'Added to cart.' : result.message);
  };

  return (
    <div className="card">
      <img
        src={imageUrl(product.image) || 'https://via.placeholder.com/300x200?text=Product'}
        alt={product.name}
      />
      <h3>{product.name}</h3>
      <p className="price">${Number(product.price).toFixed(2)}</p>
      <p className="muted">Seller: {product.seller?.name || 'Unknown'}</p>
      <Link to={`/products/${product._id}`} className="btn">View</Link>
      {user?.role === 'user' && (
        <button
          className="btn card-cart-button"
          disabled={product.stock < 1}
          onClick={handleAddToCart}
        >
          {product.stock < 1 ? 'Out of stock' : 'Add to Cart'}
        </button>
      )}
      {message && <p className="cart-message" role="status">{message}</p>}
    </div>
  );
}
