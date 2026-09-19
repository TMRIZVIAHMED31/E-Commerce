import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">ShopMERN</Link>
      <div className="nav-links">
        <Link to="/">Products</Link>
        <Link to="/cart" className="cart-link">Cart <span className="cart-count">{cartCount}</span></Link>
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
