import { Link } from 'react-router-dom';

const imageUrl = (image) => (image?.startsWith('/') ? `http://localhost:5000${image}` : image);

export default function ProductCard({ product }) {
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
    </div>
  );
}
