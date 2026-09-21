import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiOrigin } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartLogo from './CartLogo';

const imageUrl = (image) => (image?.startsWith('/') ? `${apiOrigin}${image}` : image);

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [message, setMessage] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    const result = await addToCart(product);
    setMessage(result.success ? 'Added to cart.' : result.message);
    setAdding(false);
  };

  const openProduct = () => {
    navigate(`/products/${product._id}`);
  };

  const handleCardKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProduct();
    }
  };

  return (
    <div className="card product-card" role="link" tabIndex={0} onClick={openProduct} onKeyDown={handleCardKeyDown}>
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
          onClick={(event) => {
            event.stopPropagation();
            handleAddToCart();
          }}
        >
          <CartLogo className="cart-logo-button" />
          {product.stock < 1 ? 'Out of stock' : adding ? 'Adding...' : 'Add to Cart'}
        </button>
      )}
      {message && <p className="cart-message" role="status">{message}</p>}
    </div>
  );
}
