import { searchProducts, fetchCategories } from '@/lib/ct-services';
import ProductCard from '@/components/product-card';
import ProductFilters from '@/components/product-filters';
import { cookies } from 'next/headers';
import Link from 'next/link';

interface ProductsPageProps {
  searchParams: { q?: string; category?: string };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const countryCookie = cookies().get('commerce_country')?.value || 'US';
  const countryToLocale: Record<string, string> = {
    US: 'en',
    GB: 'en-GB',
    DE: 'de',
    FR: 'fr',
  };
  const locale = countryToLocale[countryCookie] || 'en';

  const products = await searchProducts({
    query: searchParams.q ?? '',
    category: searchParams.category,
    limit: 24,
    locale,
  });

  const categories = await fetchCategories();

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Product catalog</h1>
          <p>Filter products by search term and category.</p>
        </div>
      </div>

      <div style={{ marginTop: '12px', marginBottom: '12px' }}>
        <div style={{ marginLeft: 'auto' }}>
          <ProductFilters searchParams={searchParams} categories={categories} />
        </div>
      </div>

      <section style={{ marginTop: '24px' }}>
        {(!products?.results || products.results.length === 0) ? (
          <p>No products found for your search.</p>
        ) : (
          <div className="grid grid-3">
            {(() => {
              const cards: JSX.Element[] = [];
              const list = (products.results as any[]) || [];
              for (let i = 0; i < list.length; i++) {
                const p = list[i];
                cards.push(<ProductCard key={p.id} product={p} />);
              }
              return cards;
            })()}
          </div>
        )}
      </section>
    </div>
  );
}
