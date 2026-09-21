import { useNavigate } from 'react-router-dom';
import { apiOrigin } from '../api/axios';

const imageUrl = (image) => (image?.startsWith('/') ? `${apiOrigin}${image}` : image);

export default function ProductCard({ product }) {
  const navigate = useNavigate();

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
    </div>
  );
}
