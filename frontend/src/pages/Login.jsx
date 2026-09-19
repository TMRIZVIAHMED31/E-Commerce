import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const gmailPattern = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\\.com$";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container narrow">
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="Email"
          pattern={gmailPattern}
          title="Use a valid Gmail address ending in @gmail.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" disabled={submitting}>{submitting ? 'Logging in...' : 'Login'}</button>
      </form>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
      <p className="muted">Admin/author accounts are seeded on the server and cannot self-register.</p>
    </div>
  );
}
