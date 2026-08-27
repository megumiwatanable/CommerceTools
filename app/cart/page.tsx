import Link from "next/link";
import { getCartFromRequest } from "@/lib/ct-cart";
import { searchProducts } from "@/lib/ct-services";
import { formatMoney } from "@/lib/money";
import { getProductHref } from "@/lib/product-link";
import OrderTotals from "@/components/order-totals";
import ProductCard from "@/components/product-card";
import DiscountCodeForm from "@/components/discount-code-form";
import { cookies } from "next/headers";
import { resolveStorefrontContext } from "@/lib/storefront-context";

export default async function CartPage() {
  const cart = await getCartFromRequest();
  const cookieStore = cookies();
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  const lineItems = cart?.lineItems ?? [];
  const suggestions = lineItems.length
    ? (
        await searchProducts({
          query: "",
          limit: 8,
          storeKey: storefront.store.key,
        })
      ).results
        .filter(
          (product: any) =>
            !lineItems.some((item: any) => item.productId === product.id),
        )
        .slice(0, 4)
    : [];

  return (
    <div>
      <section className="page-heading">
        <p className="eyebrow">Your selection</p>
        <h1>Shopping cart</h1>
        <p>Review your items before proceeding to checkout.</p>
      </section>
      {lineItems.length === 0 ? (
        <div className="panel empty-state">
          <h2>Your cart is empty</h2>
          <p>Browse the collection and add something you love.</p>
          <Link href="/products" className="button">
            Shop products
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-layout">
            <form
              method="post"
              action="/api/cart"
              className="cart-list cart-items-form"
            >
              <input type="hidden" name="action" value="update-all" />
              {lineItems.map((item: any) => (
                <div key={item.id} className="cart-item">
                  <Link href={getProductHref(item)}>
                    <img
                      src={item.variant.images?.[0]?.url ?? ""}
                      alt={item.name?.["en-US"] ?? "Product image"}
                    />
                  </Link>
                  <div className="cart-item-details">
                    <h3>
                      <Link href={getProductHref(item)}>
                        {item.name?.["en-US"] ||
                          Object.values(item.name ?? {})[0]}
                      </Link>
                    </h3>
                    <p>SKU: {item.variant.sku}</p>
                    <p>
                      {item.price?.discounted && (
                        <s className="price-original">
                          {formatMoney(item.price.value)}
                        </s>
                      )}{" "}
                      <span
                        className={
                          item.price?.discounted
                            ? "price-discounted"
                            : undefined
                        }
                      >
                        {formatMoney(
                          item.price?.discounted?.value ?? item.price?.value,
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="cart-item-actions">
                    <input type="hidden" name="lineItemId" value={item.id} />
                    <label>
                      Qty
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        defaultValue={item.quantity}
                        className="input"
                      />
                    </label>
                    <button
                      type="submit"
                      name="removeLineItemId"
                      value={item.id}
                      className="text-button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="cart-bulk-actions">
                <button className="button-secondary" type="submit">
                  Update all items
                </button>
              </div>
            </form>
            <aside className="panel cart-sidebar">
              <h2>Order summary</h2>
              <DiscountCodeForm />
              <OrderTotals cart={cart} />
              <Link href="/checkout" className="button">
                Proceed to checkout
              </Link>
              <form
                method="post"
                action="/api/cart"
                className="clear-cart-form"
              >
                <input type="hidden" name="action" value="clear" />
                <button className="text-button" type="submit">
                  Clear all items
                </button>
              </form>
            </aside>
          </div>
          {suggestions.length > 0 && (
            <section className="cart-suggestions">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Complete the look</p>
                  <h2>You may also like</h2>
                </div>
                <Link href="/products" className="text-button">
                  View all products
                </Link>
              </div>
              <div className="grid grid-4">
                {suggestions.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
