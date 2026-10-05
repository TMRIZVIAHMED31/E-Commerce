import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

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
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <Carousel
            className="product-list-carousel"
            opts={{ loop: products.length > 3, slidesToScroll: 1 }}
          >
            <CarouselContent className="product-list-carousel-content">
              {products.map((p) => (
                <CarouselItem key={p._id} className="product-list-carousel-item">
                  <ProductCard product={p} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {products.length > 3 && <>
              <CarouselPrevious className="product-list-carousel-previous" />
              <CarouselNext className="product-list-carousel-next" />
            </>}
          </Carousel>
        )
      )}
    </div>
  );
}
