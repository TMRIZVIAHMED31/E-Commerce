import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/spinner';

// Wrap a route element: requires login, optionally restricted to specific roles.
// Usage: <PrivateRoute roles={['seller','admin']}><SellerDashboard/></PrivateRoute>
export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="center flex items-center justify-center gap-2"><Spinner /> Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
