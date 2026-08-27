import { searchProducts, fetchCategories } from "@/lib/ct-services";
import ProductCard from "@/components/product-card";
import ProductFilters from "@/components/product-filters";
import CatalogPagination from "@/components/catalog-pagination";
import { cookies } from "next/headers";
import { resolveStorefrontContext } from "@/lib/storefront-context";

interface Props {
  searchParams: { q?: string; category?: string | string[]; page?: string };
}

export default async function ProductsPage({ searchParams }: Props) {
  const cookieStore = cookies();
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  const locale = storefront.locale;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 12;
  const [products, categories] = await Promise.all([
    searchProducts({
      query: searchParams.q ?? "",
      category: searchParams.category,
      limit,
      offset: (page - 1) * limit,
      locale,
      storeKey: storefront.store.key,
    }),
    fetchCategories(),
  ]);
  return (
    <div>
      <section className="page-heading catalog-heading">
        <p className="eyebrow">The collection</p>
        <h1>Shop all products</h1>
        <p>Find the pieces that fit your everyday.</p>
      </section>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <ProductFilters searchParams={searchParams} categories={categories} />
        </aside>
        <section className="catalog-results">
          <div className="catalog-results-heading">
            <strong>
              {products.total ?? products.results.length} product
              {(products.total ?? products.results.length) === 1 ? "" : "s"}
            </strong>
            {searchParams.q && <span>Results for “{searchParams.q}”</span>}
          </div>
          {products.results.length ? (
            <>
              <div className="grid grid-3">
                {products.results.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <CatalogPagination
                basePath="/products"
                page={page}
                total={products.total}
                limit={limit}
                query={searchParams.q}
                categories={searchParams.category}
              />
            </>
          ) : (
            <div className="panel empty-state">
              <h2>No products found</h2>
              <p>Try another search term or browse a different category.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
