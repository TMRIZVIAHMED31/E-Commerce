import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// Admin ("author") user management. Product management for admin lives in
// SellerDashboard (admin sees ALL products there and can edit/delete any of them).
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
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
                  <>
                    <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}>
                      <option value="user">user</option>
                      <option value="seller">seller</option>
                    </select>
                    <button onClick={() => handleDelete(u._id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
