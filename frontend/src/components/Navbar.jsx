import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ChatLogo from './ChatLogo';
import api from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!user) {
      setChatCount(0);
      return undefined;
    }

    let active = true;
    api.get('/chat/conversations')
      .then(({ data }) => {
        if (active) setChatCount(data.length);
      })
      .catch(() => {
        if (active) setChatCount(0);
      });

    return () => {
      active = false;
    };
  }, [user]);

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
                <button
                  type="button"
                  className="menu-theme-toggle"
                  onClick={() => setDarkMode((current) => !current)}
                  aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                >
                  <span aria-hidden="true">{darkMode ? '☀' : '☾'}</span>
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                {user?.role === 'user' && (
                  <Link to="/cart" onClick={() => setMenuOpen(false)}>
                    Cart <span className="menu-notification">{cartCount}</span>
                  </Link>
                )}
                {user && (
                  <Link to="/inbox" onClick={() => setMenuOpen(false)}>
                    <ChatLogo className="chat-logo-menu" />
                    <span>Chat</span>
                    <span className="menu-notification">{chatCount}</span>
                  </Link>
                )}
                {!user && (
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <ChatLogo className="chat-logo-menu" />
                    <span>Chat</span>
                  </Link>
                )}
              </div>
            </aside>
          </>
        )}
      </div>
      <div className="nav-links">
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
