import { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { apiOrigin } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ChatLogo from '../components/ChatLogo';
import { toast } from '../components/ui/toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../components/ui/carousel';

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
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('center center');
  const [carouselApi, setCarouselApi] = useState(null);

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

  const gallerySlides = useMemo(() => {
    const variantSlides = product?.colorImages?.flatMap((group) => (
      group.images?.map((image) => ({ image: imageUrl(image), color: group.color })) || []
    )).filter((slide) => slide.image) || [];

    if (variantSlides.length > 0) return variantSlides;
    return allGalleryImages.map((image) => ({ image, color: null }));
  }, [product, allGalleryImages]);

  const galleryImages = gallerySlides.map((slide) => slide.image);

  useEffect(() => {
    if (!carouselApi) return undefined;

    const handleSelect = () => {
      setSelectedImage(carouselApi.selectedScrollSnap());
      setIsZoomed(false);
      const activeSlide = gallerySlides[carouselApi.selectedScrollSnap()];
      if (activeSlide?.color) {
        setSelectedColor((current) => colorOptions.find(
          (option) => option.name.trim().toLowerCase() === activeSlide.color.trim().toLowerCase()
        ) || current);
      }
    };

    handleSelect();
    carouselApi.on('select', handleSelect);
    return () => carouselApi.off('select', handleSelect);
  }, [carouselApi, colorOptions, gallerySlides]);

  useEffect(() => {
    if (carouselApi && selectedImage < galleryImages.length) {
      carouselApi.scrollTo(selectedImage);
    }
  }, [carouselApi, galleryImages.length, selectedImage]);

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
    toast.add({
      title: result.success ? 'Added to cart' : 'Could not add to cart',
      description: result.message || (result.success ? `${quantity} item${quantity === 1 ? '' : 's'} added.` : 'Please try again.'),
      type: result.success ? 'success' : 'error',
    });
    if (result.success && buyNow) navigate('/cart');
    setAdding(false);
  };

  const toggleZoom = (event) => {
    if (!isZoomed) {
      const imageElement = event.currentTarget.querySelector('img');
      const bounds = imageElement?.getBoundingClientRect() || event.currentTarget.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      const y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
      setZoomOrigin(`${x}% ${y}%`);
    }
    setIsZoomed((value) => !value);
  };

  if (error) return <div className="container">{error}</div>;
  if (!product) return <div className="container">Loading...</div>;

  const isOwnProduct = user && user._id === product.seller?._id;

  return (
    <div className="container product-shell">
      <div className="product-page">
        <div className="product-gallery-panel">
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: galleryImages.length > 1 }}
            className="product-carousel"
          >
            <CarouselContent className="product-carousel-content">
              {galleryImages.map((image, index) => (
                <CarouselItem key={`${image}-${index}`} className="product-carousel-item">
                  <div
                    className={`gallery-stage ${isZoomed && selectedImage === index ? 'zoomed' : ''}`}
                    onClick={toggleZoom}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      style={{ '--zoom-origin': zoomOrigin }}
                    />
                    <button
                      type="button"
                      className="zoom-toggle"
                      onClick={(event) => {
                        event.stopPropagation();
                        setZoomOrigin('center center');
                        setIsZoomed((value) => !value);
                      }}
                    >
                      {isZoomed && selectedImage === index ? 'Click to zoom out' : 'Click to zoom'}
                    </button>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {galleryImages.length > 1 && <>
              <CarouselPrevious className="product-carousel-previous" />
              <CarouselNext className="product-carousel-next" />
            </>}
          </Carousel>

          <div className="thumbnail-row">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`thumb ${selectedImage === index ? 'active' : ''}`}
                onClick={() => {
                  setSelectedImage(index);
                  setIsZoomed(false);
                  carouselApi?.scrollTo(index);
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
                      const colorIndex = gallerySlides.findIndex((slide) => (
                        slide.color?.trim().toLowerCase() === color.name.trim().toLowerCase()
                      ));
                      const nextImage = colorIndex >= 0 ? colorIndex : 0;
                      setSelectedImage(nextImage);
                      setIsZoomed(false);
                      carouselApi?.scrollTo(nextImage);
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
                🛒 {adding ? 'Adding...' : 'Add to Cart'}
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
        </div>
      </div>
    </div>
  );
}
