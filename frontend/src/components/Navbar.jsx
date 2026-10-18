import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SidebarTrigger } from './ui/sidebar';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="brand-area">
        <SidebarTrigger aria-label="Toggle sidebar" />
        <Link to="/" className="brand">ShopMERN</Link>
      </div>
      <div className="nav-links">
        {!user && <Link to="/login">Sign in</Link>}
      </div>
    </nav>
  );
}
