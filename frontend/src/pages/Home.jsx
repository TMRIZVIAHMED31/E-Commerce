import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/products', { params: q ? { search: q } : {} });
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setError(
        err.response?.data?.message ||
          'Could not load products. Check the deployed API URL and backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  return (
    <div className="container">
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <div className="grid">
          {products.length === 0 && <p>No products found.</p>}
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
