import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Admin ("author") user management. Product management for admin lives in
// SellerDashboard (admin sees ALL products there and can edit/delete any of them).
export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (deletingId) return;
    if (!confirm('Delete this user?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/users/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <p className="muted">
        Manage users here. Manage <Link to="/seller">all products</Link> from the Seller Dashboard link (admins see every seller's products there).
      </p>
      {error && <p className="error">{error}</p>}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {u.role !== 'admin' && (
                  <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}>
                    <option value="user">user</option>
                    <option value="seller">seller</option>
                  </select>
                )}
                {u._id !== (currentUser?._id || currentUser?.id) && (
                  <button type="button" disabled={deletingId === u._id} onClick={() => handleDelete(u._id)}>
                    {deletingId === u._id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
