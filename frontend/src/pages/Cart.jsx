import { Link } from 'react-router-dom';
import { apiOrigin } from '../api/axios';
import { useCart } from '../context/CartContext';

const imageUrl = (image) => (image?.startsWith('/') ? `${apiOrigin}${image}` : image);

export default function Cart() {
  const { items, updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (productId, value) => {
    const result = updateQuantity(productId, value);
    if (!result.success) window.alert(result.message);
  };

  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  return (
    <div className="container cart-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your order</p>
          <h1>Shopping cart</h1>
        </div>
        <Link to="/" className="text-link">Continue shopping</Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p className="muted">Add something you love and it will appear here.</p>
          <Link to="/" className="btn primary-btn">Browse products</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map(({ product, quantity }) => (
              <article className="cart-item" key={product._id}>
                <img
                  src={imageUrl(product.image) || 'https://via.placeholder.com/160x120?text=Product'}
                  alt={product.name}
                />
                <div className="cart-item-info">
                  <Link to={`/products/${product._id}`}><h2>{product.name}</h2></Link>
                  <p className="price">${Number(product.price).toFixed(2)}</p>
                  <p className="muted">{product.stock} available</p>
                  <div className="cart-item-actions">
                    <label>
                      Qty
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(event) => handleQuantityChange(product._id, event.target.value)}
                      />
                    </label>
                    <button className="link-button" onClick={() => removeFromCart(product._id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <strong>${(Number(product.price) * quantity).toFixed(2)}</strong>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Summary</h2>
            <div><span>Subtotal</span><strong>${total.toFixed(2)}</strong></div>
            <p className="muted">Checkout will be available once payment processing is connected.</p>
          </aside>
        </div>
      )}
    </div>
  );
}