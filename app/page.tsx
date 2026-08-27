import { searchProducts } from "@/lib/ct-services";
import ProductCard from "@/components/product-card";
import { cookies } from "next/headers";
import { resolveStorefrontContext } from "@/lib/storefront-context";

export default async function HomePage() {
  const cookieStore = cookies();
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  const products = await searchProducts({
    query: "",
    limit: 6,
    storeKey: storefront.store.key,
  });

  return (
    <div>
      <section className="hero-card hero-home">
        <div className="hero-copy">
          <div>
            <p className="eyebrow">The everyday edit</p>
            <h1>Better things for your everyday.</h1>
            <p>
              Discover thoughtful products, straightforward prices, and a
              shopping experience that feels easy.
            </p>
          </div>
          <a className="button" href="/products">
            Shop the collection
          </a>
        </div>
      </section>

      <section className="product-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Just in</p>
            <h2>Featured products</h2>
          </div>
          <a href="/products" className="text-button">
            View all products
          </a>
        </div>
        <div className="grid grid-3">
          {products.results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
