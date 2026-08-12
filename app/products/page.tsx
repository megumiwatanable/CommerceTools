import { searchProducts } from '@/lib/ct-services';
import ProductCard from '@/components/product-card';
import ProductFilters from '@/components/product-filters';

interface ProductsPageProps {
  searchParams: { q?: string; category?: string };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const products = await searchProducts({
    query: searchParams.q ?? '',
    category: searchParams.category,
    limit: 24,
  });

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Product catalog</h1>
          <p>Filter products by search term and category.</p>
        </div>
      </div>

      <div className="panel">
        <ProductFilters searchParams={searchParams} />
      </div>

      <section style={{ marginTop: '24px' }}>
        {products.results.length === 0 ? (
          <p>No products found for your search.</p>
        ) : (
          <div className="grid grid-3">
            {products.results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
