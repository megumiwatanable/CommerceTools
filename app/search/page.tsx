import { searchProducts } from '@/lib/ct-services';
import ProductCard from '@/components/product-card';

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? '';
  const products = await searchProducts({ query, limit: 24 });

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Search</h1>
          <p>Find products across the catalog.</p>
        </div>
      </div>

      <section className="panel">
        <form action="/search" method="get" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input className="input" name="q" defaultValue={query} placeholder="Search products" />
          <button className="button" type="submit">
            Search
          </button>
        </form>
      </section>

      {query ? (
        <section style={{ marginTop: '24px' }}>
          <h2 className="section-title">Search results for "{query}"</h2>
          {products.results.length === 0 ? (
            <p>No products matched your search.</p>
          ) : (
            <div className="grid grid-3">
              {products.results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
