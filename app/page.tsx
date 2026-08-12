import { searchProducts } from '@/lib/ct-services';
import ProductCard from '@/components/product-card';

export default async function HomePage() {
  const products = await searchProducts({ query: '', limit: 6 });

  return (
    <div>
      <section className="hero-card">
        <div className="brand-bar">
          <div>
            <p className="section-title">Commerce App</p>
            <p>A modern B2C storefront connected to commercetools.</p>
          </div>
          <div>
            <a className="button" href="/products">
              Browse products
            </a>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '32px' }}>
        <h2 className="section-title">Featured products</h2>
        <div className="grid grid-3">
          {products.results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
