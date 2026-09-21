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
  colors: [],
  warranty: '',
  options: '',
  images: [],
};

const normalizeColors = (value) => {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
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
  const [colorDraft, setColorDraft] = useState('');

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
    setColorDraft('');
  };

  const addColor = () => {
    const nextColor = colorDraft.trim();
    if (!nextColor) return;
    setForm((current) => {
      const colors = normalizeColors(current.colors);
      const nextColors = colors.includes(nextColor) ? colors : [...colors, nextColor];
      return {
        ...current,
        colors: nextColors,
        color: current.color || nextColor,
      };
    });
    setColorDraft('');
  };

  const removeColor = (colorToRemove) => {
    setForm((current) => {
      const nextColors = (current.colors || []).filter((color) => color !== colorToRemove);
      return {
        ...current,
        colors: nextColors,
        color: nextColors[0] || '',
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setSaving(true);

    const colors = normalizeColors(form.colors);
    const primaryColor = form.color || colors[0] || '';
    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('description', form.description);
    payload.append('price', Number(form.price));
    payload.append('category', form.category);
    payload.append('stock', Number(form.stock || 0));
    payload.append('color', primaryColor);
    payload.append('colors', JSON.stringify(colors));
    payload.append(
      'properties',
      JSON.stringify({
        warranty: form.warranty,
      })
    );
    payload.append(
      'details',
      JSON.stringify({
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
    const colors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [p.color].filter(Boolean);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      color: p.color || colors[0] || '',
      colors,
      warranty: p.properties?.warranty || '',
      options: p.details?.options || '',
      images: [],
    });
    setColorDraft('');
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
    <div className="container seller-dashboard-wrap">
      <div className="dashboard-header-row">
        <div>
          <p className="eyebrow">Seller Panel</p>
          <h2>{user.role === 'admin' ? 'All Products (Admin)' : 'My Products'}</h2>
        </div>
      </div>

      <div className="seller-dashboard-grid">
        <form onSubmit={handleSubmit} className="form product-form seller-form-panel">
          <div className="seller-form-header">
            <h3>{editingId ? 'Edit product' : 'Add new product'}</h3>
            {editingId && (
              <button type="button" className="secondary-btn" onClick={resetForm}>Reset</button>
            )}
          </div>

          {error && <p className="error">{error}</p>}

          <div className="seller-form-grid">
            <div className="field-group wide">
              <label>Name</label>
              <input
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="field-group wide">
              <label>Description</label>
              <textarea
                placeholder="Describe the product"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="120.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div className="field-group">
              <label>Category</label>
              <input
                placeholder="Kitchen, Home, Tech..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label>Stock</label>
              <input
                type="number"
                placeholder="10"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label>Primary color</label>
              <input
                placeholder="White"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>

            <div className="field-group wide">
              <label>Available colors</label>
              <div className="color-input-row">
                <input
                  placeholder="Add color, e.g. Red"
                  value={colorDraft}
                  onChange={(e) => setColorDraft(e.target.value)}
                />
                <button type="button" className="secondary-btn" onClick={addColor}>Add</button>
              </div>
              <div className="tag-list">
                {form.colors.length === 0 && <span className="empty-tag">No colors added yet</span>}
                {form.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`tag ${form.color === color ? 'selected' : ''}`}
                    onClick={() => setForm((current) => ({ ...current, color }))}
                  >
                    {color}
                    <span onClick={(event) => {
                      event.stopPropagation();
                      removeColor(color);
                    }}>×</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group wide">
              <label>Warranty</label>
              <input
                type="text"
                placeholder="2 years"
                value={form.warranty}
                onChange={(e) => setForm({ ...form, warranty: e.target.value })}
              />
            </div>

            <div className="field-group wide">
              <label>Options / details</label>
              <textarea
                placeholder="Imported from China, stainless steel, etc."
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
              />
            </div>

            <div className="field-group wide">
              <label>Product images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setForm({ ...form, images: e.target.files || [] })}
              />
              {form.images && form.images.length > 0 && (
                <div className="image-preview-list">
                  {Array.from(form.images).slice(0, 4).map((file, index) => (
                    <span key={`${file.name}-${index}`} className="preview-pill">{file.name}</span>
                  ))}
                  {form.images.length > 4 && <span className="preview-pill more">+{form.images.length - 4} more</span>}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}</button>
            {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        <div className="seller-product-list-panel">
          <div className="seller-list-header">
            <h3>Product List</h3>
          </div>

          <div className="table-wrap">
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
                      <div className="row-actions">
                        <button type="button" onClick={() => handleEdit(p)}>Edit</button>
                        <button type="button" className="danger-btn" disabled={deletingId === p._id} onClick={() => handleDelete(p._id)}>{deletingId === p._id ? 'Deleting...' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={user.role === 'admin' ? 5 : 4}>No products yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
