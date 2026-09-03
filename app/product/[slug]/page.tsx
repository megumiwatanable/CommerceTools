import { getProductBySlug, searchProducts } from "@/lib/ct-services";
import ProductCard from "@/components/product-card";
import ProductGallery from "@/components/product-gallery";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { formatMoney, selectPublicPrice } from "@/lib/money";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { getProductHref } from "@/lib/product-link";
import { getProductReviews, getReviewSummaries } from "@/lib/ct-reviews";
import { getCurrentCustomer } from "@/lib/ct-customers";
import ProductReviewModal from "@/components/product-review-modal";

interface Props {
  params: { slug: string };
}

export default async function ProductPage({ params }: Props) {
  const cookieStore = cookies();
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  const product = await getProductBySlug(params.slug, storefront.store.key);
  if (!product) notFound();
  const variant = product.masterVariant;
  const price = selectPublicPrice(variant?.prices, storefront.country.code);
  const name =
    product.name?.["en-US"] ||
    product.name?.["en-GB"] ||
    Object.values(product.name ?? {})[0] ||
    "Product";
  const description =
    product.description?.["en-US"] ||
    product.description?.["en-GB"] ||
    Object.values(product.description ?? {})[0] ||
    "Product details";
  const images = (variant?.images ?? []).map((image: any) => ({
    url: image.url,
    label: image.label,
  }));
  const sku = variant?.sku || "N/A";
  const quantity = variant?.availability?.availableQuantity || 0;
  const inStock = quantity > 0;
  const categoryId =
    product.categories?.[0]?.id || product.categories?.[0]?.obj?.id;
  const related = (
    await searchProducts({
      query: "",
      category: categoryId,
      limit: 6,
      locale: storefront.locale,
      storeKey: storefront.store.key,
    })
  ).results
    .filter((item: any) => item.id !== product.id)
    .slice(0, 4);
  const [reviews, customer, relatedReviewSummaries] = await Promise.all([
    getProductReviews(product.id),
    getCurrentCustomer(),
    getReviewSummaries(related.map((item: any) => item.id)),
  ]);
  const productHref = getProductHref(product);

  return (
    <div className="product-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Products</Link>
        <span>/</span>
        <span>{name}</span>
      </nav>
      <div className="product-detail-layout">
        <ProductGallery images={images} alt={name} />
        <section className="product-buy-panel">
          <p className="eyebrow">Product details</p>
          <h1>{name}</h1>
          <p className="product-detail-sku">SKU: {sku}</p>
          <ProductReviewModal
            productId={product.id}
            productName={String(name)}
            returnTo={productHref}
            reviews={reviews}
            signedIn={Boolean(customer)}
          />
          <div className="product-detail-price">
            {price ? (
              <>
                {price.discounted && (
                  <s className="price-original">{formatMoney(price.value)}</s>
                )}
                <strong
                  className={price.discounted ? "price-discounted" : undefined}
                >
                  {formatMoney(price.discounted?.value ?? price.value)}
                </strong>
              </>
            ) : (
              <strong>Contact us</strong>
            )}
          </div>
          <p className={`stock-status ${inStock ? "in-stock" : ""}`}>
            <span />
            {inStock
              ? `${quantity} available · In stock`
              : "Currently out of stock"}
          </p>
          <div className="product-description">
            <h2>About this product</h2>
            <p>{description}</p>
          </div>
          <div className="product-purchase-actions">
            <form method="post" action="/api/cart" className="product-add-form">
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="sku" value={sku} />
            <label htmlFor="quantity">Quantity</label>
            <div>
              <input
                type="number"
                id="quantity"
                name="quantity"
                defaultValue={1}
                min={1}
                max={quantity || 99}
                className="input"
                disabled={!inStock}
              />
              <button className="button" type="submit" disabled={!inStock}>
                {inStock ? "Add to cart" : "Out of stock"}
              </button>
            </div>
            </form>
            <form method="post" action="/api/wishlist" className="wishlist-save-form product-detail-heart">
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="variantId" value={variant.id} />
            <input type="hidden" name="returnTo" value={getProductHref(product)} />
            <button className="icon-button heart-button" type="submit" aria-label="Save to wishlist" title="Save to wishlist">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            </form>
          </div>
          <p className="product-assurance">
            Secure checkout · Easy returns · Delivery calculated at checkout
          </p>
        </section>
      </div>
      <section className="product-related">
        <div className="section-heading">
          <div>
            <p className="eyebrow">More to explore</p>
            <h2>You may also like</h2>
          </div>
          <Link href="/products" className="text-button">
            Shop all
          </Link>
        </div>
        {related.length ? (
          <div className="grid grid-4">
            {related.map((item: any) => (
              <ProductCard key={item.id} product={item} reviewSummary={relatedReviewSummaries.get(item.id)} />
            ))}
          </div>
        ) : (
          <p className="empty-copy">
            More recommendations will appear here soon.
          </p>
        )}
      </section>
    </div>
  );
}
