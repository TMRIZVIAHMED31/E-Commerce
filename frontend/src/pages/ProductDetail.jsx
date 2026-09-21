import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { apiOrigin } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const imageUrl = (image) => (image?.startsWith('/') ? `${apiOrigin}${image}` : image);
const fallbackImage = 'https://images.unsplash.com/photo-1585518419759-7fe2e0fbf8a6?auto=format&fit=crop&w=900&q=80';

const colorOptions = [
  { name: 'Matte Black', value: '#1b1d20' },
  { name: 'Stone Grey', value: '#d4d4d8' },
  { name: 'Cloud White', value: '#f4f4f5' },
];

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => setError('Product not found'));
  }, [id]);

  const galleryImages = useMemo(() => {
    const primary = imageUrl(product?.image) || fallbackImage;
    return [primary, primary, primary];
  }, [product]);

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
    if (adding) return;
    setAdding(true);
    const result = await addToCart(product, quantity);
    setCartMessage(result.message || `${quantity} item${quantity === 1 ? '' : 's'} added to cart.`);
    if (result.success && buyNow) navigate('/cart');
    setAdding(false);
  };

  if (error) return <div className="container">{error}</div>;
  if (!product) return <div className="container">Loading...</div>;

  const isOwnProduct = user && user._id === product.seller?._id;

  return (
    <div className="container product-shell">
      <div className="product-page">
        <div className="product-gallery-panel">
          <div className={`gallery-stage ${isZoomed ? 'zoomed' : ''}`} onClick={() => setIsZoomed((value) => !value)}>
            <img src={galleryImages[selectedImage]} alt={product.name} />
            <button type="button" className="zoom-toggle" onClick={(event) => {
              event.stopPropagation();
              setIsZoomed((value) => !value);
            }}>
              {isZoomed ? 'Click to zoom out' : 'Click to zoom'}
            </button>
          </div>

          <div className="thumbnail-row">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`thumb ${selectedImage === index ? 'active' : ''}`}
                onClick={() => {
                  setSelectedImage(index);
                  setIsZoomed(false);
                }}
              >
                <img src={image} alt={`${product.name} view ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="product-info-panel">
          <h1>{product.name}</h1>
          <div className="price-line">${Number(product.price).toFixed(2)}</div>

          <div className="stock-row">
            <span className="stock-badge">✓ In Stock</span>
          </div>

          <div className="option-block">
            <span className="option-label">Color</span>
            <div className="color-swatches">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={`color-swatch ${selectedColor.name === color.name ? 'selected' : ''}`}
                  title={color.name}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color)}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
            <div className="selected-color-name">{selectedColor.name}</div>
          </div>

          <div className="purchase-row">
            <div className="quantity-stepper" aria-label="Select quantity">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock || 99, value + 1))}>+</button>
            </div>

            {user?.role === 'user' && (
              <button type="button" className="add-to-cart-button" disabled={product.stock < 1 || adding} onClick={() => addProduct()}>
                🛒 {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            )}
          </div>

          <div className="detail-box first-box">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="detail-box">
            <h3>Properties</h3>
            <div className="spec-grid">
              <span className="key">Warranty</span>
              <span className="value">2 Years</span>

              <span className="key">Wattage</span>
              <span className="value">1800W</span>

              <span className="key">Capacity</span>
              <span className="value">6.2L</span>

              <span className="key">Voltage</span>
              <span className="value">220-240V</span>
            </div>
          </div>

          <div className="detail-box">
            <h3>Details</h3>
            <div className="spec-grid">
              <span className="key">SKU</span>
              <span className="value">DIGITAL-AIR-FRYER-6L-MATTE-BLACK</span>

              <span className="key">Options</span>
              <span className="value">Color: {selectedColor.name}</span>
            </div>
          </div>

          {user && user.role === 'user' && (
            <button type="button" className="chat-button" onClick={startChat}>Chat with seller</button>
          )}
          {!user && <p className="muted">Login as a buyer to chat with the seller.</p>}
          {isOwnProduct && <p className="muted">This is your own product listing.</p>}
          {cartMessage && <p className="cart-message" role="status">{cartMessage}</p>}
        </div>
      </div>
    </div>
  );
}
