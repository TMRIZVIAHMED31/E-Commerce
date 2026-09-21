import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
  color: '',
  colors: '',
  warranty: '',
  wattage: '',
  capacity: '',
  voltage: '',
  sku: '',
  options: '',
  images: [],
};

// Seller: manages ONLY their own products.
// Admin ("author"): sees and can edit/delete every product in the system.
export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    const { data } = await api.get('/products/mine/list');
    setProducts(data);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);
    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('description', form.description);
    payload.append('price', Number(form.price));
    payload.append('category', form.category);
    payload.append('stock', Number(form.stock || 0));
    payload.append('color', form.color || '');
    payload.append('colors', JSON.stringify((form.colors || '').split(',').map((item) => item.trim()).filter(Boolean)));
    payload.append(
      'properties',
      JSON.stringify({
        warranty: form.warranty,
        wattage: form.wattage,
        capacity: form.capacity,
        voltage: form.voltage,
      })
    );
    payload.append(
      'details',
      JSON.stringify({
        sku: form.sku,
        options: form.options,
      })
    );

    if (form.images && form.images.length > 0) {
      Array.from(form.images).forEach((file) => payload.append('images', file));
    }

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      color: p.color || '',
      colors: (p.colors || []).join(', '),
      warranty: p.properties?.warranty || '',
      wattage: p.properties?.wattage || '',
      capacity: p.properties?.capacity || '',
      voltage: p.properties?.voltage || '',
      sku: p.details?.sku || '',
      options: p.details?.options || '',
      images: [],
    });
  };

  const handleDelete = async (idToDelete) => {
    if (deletingId) return;
    if (!confirm('Delete this product?')) return;
    setDeletingId(idToDelete);
    try {
      await api.delete(`/products/${idToDelete}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container">
      <h2>{user.role === 'admin' ? 'All Products (Admin)' : 'My Products'}</h2>

      <form onSubmit={handleSubmit} className="form product-form">
        <h3>{editingId ? 'Edit product' : 'Add new product'}</h3>
        {error && <p className="error">{error}</p>}
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />
        <input
          placeholder="Primary color"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        />
        <input
          placeholder="Available colors (comma separated)"
          value={form.colors}
          onChange={(e) => setForm({ ...form, colors: e.target.value })}
        />
        <input
          type="text"
          placeholder="Warranty"
          value={form.warranty}
          onChange={(e) => setForm({ ...form, warranty: e.target.value })}
        />
        <input
          type="text"
          placeholder="Wattage"
          value={form.wattage}
          onChange={(e) => setForm({ ...form, wattage: e.target.value })}
        />
        <input
          type="text"
          placeholder="Capacity"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
        <input
          type="text"
          placeholder="Voltage"
          value={form.voltage}
          onChange={(e) => setForm({ ...form, voltage: e.target.value })}
        />
        <input
          type="text"
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
        <textarea
          placeholder="Details / product options"
          value={form.options}
          onChange={(e) => setForm({ ...form, options: e.target.value })}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setForm({ ...form, images: e.target.files || [] })}
        />
        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            {user.role === 'admin' && <th>Seller</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>${Number(p.price).toFixed(2)}</td>
              <td>{p.stock}</td>
              {user.role === 'admin' && <td>{p.seller?.name}</td>}
              <td>
                <button type="button" onClick={() => handleEdit(p)}>Edit</button>
                <button type="button" disabled={deletingId === p._id} onClick={() => handleDelete(p._id)}>{deletingId === p._id ? 'Deleting...' : 'Delete'}</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={5}>No products yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
