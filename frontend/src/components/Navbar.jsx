import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="brand-area">
        <button
          type="button"
          className="menu-toggle"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
        <Link to="/" className="brand">ShopMERN</Link>
        {menuOpen && (
          <>
            <button type="button" className="menu-backdrop" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />
            <aside className="menu-drawer" aria-label="Navigation menu">
              <div className="menu-drawer-header">
                <span className="menu-drawer-mark">S</span>
                <button type="button" className="menu-close" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)}>x</button>
              </div>
              <div className="menu-drawer-links">
                <Link to="/" className="active" onClick={() => setMenuOpen(false)}>Home</Link>
                {user?.role === 'user' && (
                  <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>
                )}
                {user && <Link to="/inbox" onClick={() => setMenuOpen(false)}>Chat</Link>}
                {!user && <Link to="/login" onClick={() => setMenuOpen(false)}>Chat</Link>}
              </div>
            </aside>
          </>
        )}
      </div>
      <div className="nav-links">
        <Link to="/">Products</Link>
        {user?.role === 'user' && (
          <Link to="/cart" className="cart-link">
            Cart <span className="cart-count">{cartCount}</span>
          </Link>
        )}
        {user && <Link to="/inbox">Chat</Link>}
        {user && (user.role === 'seller' || user.role === 'admin') && (
          <Link to="/seller">Seller Dashboard</Link>
        )}
        {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}

        {!user && <Link to="/login">Login</Link>}
        {!user && <Link to="/register">Register</Link>}
        {user && (
          <span className="nav-user">
            {user.name} ({user.role})
            <button onClick={handleLogout}>Logout</button>
          </span>
        )}
      </div>
    </nav>
  );
}
