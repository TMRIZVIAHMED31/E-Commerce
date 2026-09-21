import { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { apiOrigin } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ChatLogo from '../components/ChatLogo';
import CartLogo from '../components/CartLogo';

const imageUrl = (image) => (image?.startsWith('/') ? `${apiOrigin}${image}` : image);
const fallbackImage = 'https://images.unsplash.com/photo-1585518419759-7fe2e0fbf8a6?auto=format&fit=crop&w=900&q=80';

const colorPalette = {
  black: '#1b1d20',
  'matte black': '#1b1d20',
  grey: '#d4d4d8',
  'stone grey': '#d4d4d8',
  white: '#f4f4f5',
  'cloud white': '#f4f4f5',
  red: '#ef4444',
  blue: '#2563eb',
  silver: '#e5e7eb',
  green: '#22c55e',
};

const normalizeColorValue = (name) => {
  if (!name) return '#d1d5db';
  const match = colorPalette[name.trim().toLowerCase()];
  return match || '#d1d5db';
};

const getProductColors = (product) => [...new Set([
  ...(product?.color ? [product.color] : []),
  ...(Array.isArray(product?.colors) ? product.colors : []),
].map((value) => String(value).trim()).filter(Boolean))];

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
  const [selectedColor, setSelectedColor] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data)).catch(() => setError('Product not found'));
  }, [id]);

  const colorOptions = useMemo(() => {
    const values = getProductColors(product);
    return values.map((value) => ({
      name: value,
      value: normalizeColorValue(value),
    }));
  }, [product]);

  useEffect(() => {
    if (colorOptions.length > 0) {
      setSelectedColor((current) => current && colorOptions.some((option) => option.name === current.name) ? current : colorOptions[0]);
    }
  }, [colorOptions]);

  const allGalleryImages = useMemo(() => {
    const images = product?.images?.length ? product.images.map((image) => imageUrl(image)).filter(Boolean) : [];
    if (images.length > 0) return images;
    const primary = imageUrl(product?.image) || fallbackImage;
    return [primary];
  }, [product]);

  const galleryImages = useMemo(() => {
    const selectedName = selectedColor?.name?.trim().toLowerCase();
    const variant = product?.colorImages?.find((group) => group.color?.trim().toLowerCase() === selectedName);
    const variantImages = variant?.images?.map((image) => imageUrl(image)).filter(Boolean) || [];
    return variantImages.length > 0 ? variantImages : allGalleryImages;
  }, [product, selectedColor, allGalleryImages]);

  const activeProductImage = galleryImages[selectedImage] || galleryImages[0] || fallbackImage;

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
            <img src={activeProductImage} alt={product.name} />
            <button
              type="button"
              className="zoom-toggle"
              onClick={(event) => {
                event.stopPropagation();
                setIsZoomed((value) => !value);
              }}
            >
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
            <span className={`stock-badge ${product.stock < 1 ? 'out-of-stock' : ''}`}>
              {product.stock > 0 ? `✓ In Stock: ${product.stock} available` : 'Out of stock'}
            </span>
          </div>

          {colorOptions.length > 0 && (
            <div className="option-block">
              <span className="option-label">Color</span>
              <div className="color-swatches">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className={`color-swatch ${selectedColor?.name === color.name ? 'selected' : ''}`}
                    title={color.name}
                    style={{ backgroundColor: color.value }}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedImage(0);
                      setIsZoomed(false);
                    }}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                ))}
              </div>
              <div className="selected-color-name">{selectedColor?.name || colorOptions[0].name}</div>
            </div>
          )}

          <div className="purchase-row">
            <div className="quantity-stepper" aria-label="Select quantity">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock || 99, value + 1))}>+</button>
            </div>

            {user?.role === 'user' && (
              <button type="button" className="add-to-cart-button" disabled={product.stock < 1 || adding} onClick={() => addProduct()}>
                <CartLogo className="cart-logo-button" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            )}
          </div>

          <div className="detail-box first-box">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {(product.properties && Object.values(product.properties).some(Boolean)) && (
            <div className="detail-box">
              <h3>Properties</h3>
              <div className="spec-grid">
                {Object.entries(product.properties || {}).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <Fragment key={key}>
                      <span className="key">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <span className="value">{value}</span>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {(product.details && Object.values(product.details).some(Boolean)) && (
            <div className="detail-box">
              <h3>Details</h3>
              <div className="spec-grid">
                {Object.entries(product.details || {}).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <Fragment key={key}>
                      <span className="key">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <span className="value">{value}</span>
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {user && user.role === 'user' && (
            <button type="button" className="chat-button" onClick={startChat}>
              <ChatLogo className="chat-logo-button" />
              Chat with seller
            </button>
          )}
          {!user && <p className="muted">Login as a buyer to chat with the seller.</p>}
          {isOwnProduct && <p className="muted">This is your own product listing.</p>}
          {cartMessage && <p className="cart-message" role="status">{cartMessage}</p>}
        </div>
      </div>
    </div>
  );
}
