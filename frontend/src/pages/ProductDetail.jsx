import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const imageUrl = (image) => (image?.startsWith('/') ? `http://localhost:5000${image}` : image);

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

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

      {user && user.role === 'user' && (
        <button onClick={startChat}>Chat with seller</button>
      )}
      {!user && <p className="muted">Login as a buyer to chat with the seller.</p>}
      {isOwnProduct && <p className="muted">This is your own product listing.</p>}
    </div>
  );
}
