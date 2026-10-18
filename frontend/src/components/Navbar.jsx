import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SidebarTrigger } from './ui/sidebar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="brand-area">
        <SidebarTrigger aria-label="Toggle sidebar" />
        <Link to="/" className="brand">ShopMERN</Link>
      </div>
      <div className="nav-links">
        {!user && <Link to="/login">Sign in</Link>}
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
