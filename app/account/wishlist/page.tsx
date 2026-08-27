import Link from "next/link";
import AccountGuest from "@/components/account-guest";
import AccountShell from "@/components/account-shell";
import { getCurrentCustomer } from "@/lib/ct-customers";
import { fetchProductProjectionsByIds } from "@/lib/ct-services";
import { getCustomerWishlist } from "@/lib/ct-wishlist";
import { formatMoney, selectPublicPrice } from "@/lib/money";
import { getProductHref } from "@/lib/product-link";
import { cookies } from "next/headers";
import { resolveStorefrontContext } from "@/lib/storefront-context";

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <AccountGuest />;
  const cookieStore = cookies();
  const [wishlist, storefront] = await Promise.all([
    getCustomerWishlist(customer.id),
    resolveStorefrontContext(
      cookieStore.get("commerce_store_key")?.value,
      cookieStore.get("commerce_country")?.value,
    ),
  ]);
  const lineItems = wishlist?.lineItems ?? [];
  const products = await fetchProductProjectionsByIds(
    lineItems.map((item: any) => item.productId),
    storefront.store.key,
  );
  const productsById = new Map(products.map((product: any) => [product.id, product]));

  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Saved products</p>
        <h1>My wishlist</h1>
        <p>Select products to add them to your cart or remove them together.</p>
      </section>
      <AccountShell customer={customer} active="wishlist">
        <section className="panel account-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Favourites</p>
              <h2>{lineItems.length} saved {lineItems.length === 1 ? "item" : "items"}</h2>
            </div>
          </div>
          {lineItems.length ? (
            <form method="post" action="/api/wishlist" className="wishlist-selection-form">
              <input type="hidden" name="returnTo" value="/account/wishlist" />
              <div className="wishlist-batch-actions">
                <span>Select the products you want to update</span>
                <div>
                  <button className="button" type="submit" name="action" value="add-selected" formAction="/api/cart">Add selected to cart</button>
                  <button className="button-secondary" type="submit" name="action" value="remove-selected">Remove selected</button>
                </div>
              </div>
              <div className="wishlist-grid">
                {lineItems.map((item: any) => {
                  const product: any = productsById.get(item.productId);
                  const variants = product ? [product.masterVariant, ...(product.variants ?? [])] : [];
                  const variant = variants.find((entry: any) => entry?.id === item.variantId) ?? item.variant;
                  const name = product?.name?.["en-US"] ?? Object.values(product?.name ?? item.name ?? {})[0] ?? "Product";
                  const description = product?.description?.["en-US"] ?? Object.values(product?.description ?? {})[0];
                  const price = selectPublicPrice(variant?.prices, storefront.country.code);
                  const available = variant?.availability?.isOnStock !== false && (variant?.availability?.availableQuantity ?? 1) > 0;
                  const selection = JSON.stringify({ productId: item.productId, variantId: item.variantId, sku: variant?.sku });
                  return (
                    <article className="wishlist-item" key={item.id}>
                      <label className="wishlist-selector" title="Select product">
                        <input type="checkbox" name="selection" value={selection} />
                        <span aria-hidden />
                      </label>
                      <Link href={getProductHref(product ?? item)} className="wishlist-image">
                        {variant?.images?.[0]?.url ? <img src={variant.images[0].url} alt={String(name)} /> : <span className="product-image-placeholder">No image</span>}
                      </Link>
                      <div className="wishlist-item-details">
                        <h3><Link href={getProductHref(product ?? item)}>{String(name)}</Link></h3>
                        {description && <p className="wishlist-description">{String(description)}</p>}
                        <div className="wishlist-meta-row">
                          <strong>{price ? formatMoney(price.discounted?.value ?? price.value) : "Contact us"}</strong>
                          <span>SKU: {variant?.sku ?? "—"}</span>
                          <span className={available ? "in-stock" : "out-of-stock"}>{available ? "In stock" : "Out of stock"}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </form>
          ) : (
            <div className="empty-state">
              <h2>Your wishlist is empty</h2>
              <p>Save products you want to revisit later.</p>
              <Link href="/products" className="button">Browse products</Link>
            </div>
          )}
        </section>
      </AccountShell>
    </div>
  );
}
