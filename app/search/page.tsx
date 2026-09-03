import { searchProducts, fetchCategories } from "@/lib/ct-services";
import ProductCard from "@/components/product-card";
import ProductFilters from "@/components/product-filters";
import CatalogPagination from "@/components/catalog-pagination";
import { cookies } from "next/headers";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { getReviewSummaries } from "@/lib/ct-reviews";

interface Props {
  searchParams: { q?: string; category?: string | string[]; page?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const limit = 12;
  const cookieStore = cookies();
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  const [products, categories] = await Promise.all([
    searchProducts({
      query,
      category: searchParams.category,
      limit,
      offset: (page - 1) * limit,
      locale: storefront.locale,
      storeKey: storefront.store.key,
    }),
    fetchCategories(),
  ]);
  const reviewSummaries = await getReviewSummaries(products.results.map((product: any) => product.id));
  return (
    <div>
      <section className="page-heading catalog-heading">
        <p className="eyebrow">Search</p>
        <h1>{query ? `Results for “${query}”` : "Find a product"}</h1>
        <p>Search by product name, description, or SKU.</p>
      </section>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <ProductFilters
            action="/search"
            searchParams={searchParams}
            categories={categories}
          />
        </aside>
        <section className="catalog-results">
          {query ? (
            <>
              <div className="catalog-results-heading">
                <strong>
                  {products.total ?? products.results.length} result
                  {(products.total ?? products.results.length) === 1 ? "" : "s"}
                </strong>
              </div>
              {products.results.length ? (
                <>
                  <div className="grid grid-3">
                    {products.results.map((product: any) => (
                      <ProductCard key={product.id} product={product} reviewSummary={reviewSummaries.get(product.id)} />
                    ))}
                  </div>
                  <CatalogPagination
                    basePath="/search"
                    page={page}
                    total={products.total}
                    limit={limit}
                    query={query}
                    categories={searchParams.category}
                  />
                </>
              ) : (
                <div className="panel empty-state">
                  <h2>No results found</h2>
                  <p>Try a shorter or different search phrase.</p>
                </div>
              )}
            </>
          ) : (
            <div className="panel empty-state">
              <h2>Start your search</h2>
              <p>
                Use the search field in the sidebar to explore the catalogue.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
