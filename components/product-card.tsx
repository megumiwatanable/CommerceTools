import Link from "next/link";
import { cookies } from "next/headers";
import { formatMoney, selectPublicPrice } from "@/lib/money";
import { getProductHref } from "@/lib/product-link";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import ProductRating from "@/components/product-rating";
import type { ReviewSummary } from "@/lib/ct-reviews";

interface ProductCardProps {
  product: any;
  reviewSummary?: ReviewSummary;
}

export default async function ProductCard({ product, reviewSummary }: ProductCardProps) {
  const variant = product.masterVariant;
  const cookieStore = cookies();
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  const productPrice = selectPublicPrice(
    variant?.prices,
    storefront.country.code,
  );
  const imageUrl = variant.images?.[0]?.url;
  const name =
    product.name?.["en-US"] ||
    product.name?.["en-GB"] ||
    Object.values(product.name ?? {})[0] ||
    "Product";
  const signedIn = Boolean(cookieStore.get("commerce_customer_id")?.value);
  const productHref = getProductHref(product);

  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link href={productHref} className="product-link">
        <div className="product-image">
          {imageUrl ? (
            <img src={imageUrl} alt={name} />
          ) : (
            <div className="product-image-placeholder">No image</div>
          )}
        </div>
        </Link>
        <form method="post" action="/api/wishlist" className="product-heart-form">
          <input type="hidden" name="action" value="add" />
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="variantId" value={variant.id} />
          <input type="hidden" name="returnTo" value={productHref} />
          <button className="icon-button heart-button" type="submit" aria-label={signedIn ? "Save to wishlist" : "Sign in to save to wishlist"} title={signedIn ? "Save to wishlist" : "Sign in to save"}>
            <HeartIcon />
          </button>
        </form>
      </div>
      <h3 className="product-card-title"><Link href={productHref}>{name}</Link></h3>

      <div className="product-card-body">
        {reviewSummary && <ProductRating summary={reviewSummary} compact />}
        <p className="product-price">
          <svg
            className="icon icon-price"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M12 1v22"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M17 5H7v6a5 5 0 0010 0V5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {productPrice ? (
            <>
              {productPrice.discounted && (
                <s className="price-original">
                  {formatMoney(productPrice.value)}
                </s>
              )}
              <span
                className={
                  productPrice.discounted ? "price-discounted" : undefined
                }
              >
                {formatMoney(
                  productPrice.discounted?.value ?? productPrice.value,
                )}
              </span>
            </>
          ) : (
            "Contact us"
          )}
        </p>
        <p className="product-meta">SKU: {variant.sku}</p>

        <div className="product-card-actions">
          <form
            method="post"
            action="/api/cart"
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="sku" value={variant.sku} />
            <input
              type="number"
              name="quantity"
              defaultValue={1}
              min={1}
              className="input"
              style={{ width: "80px" }}
            />
            <button
              type="submit"
              className="button"
              style={{
                padding: "10px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                className="icon icon-cart"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M6 6h15l-1.5 9h-11L6 6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
              Add to Cart
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
