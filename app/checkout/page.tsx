import { getCartFromRequest } from "@/lib/ct-cart";
import CheckoutForm from "@/components/checkout-form";
import { formatMoney } from "@/lib/money";
import OrderTotals from "@/components/order-totals";
import DiscountCodeForm from "@/components/discount-code-form";
import Link from "next/link";
import { getProductHref } from "@/lib/product-link";
import { getCurrentCustomer } from "@/lib/ct-customers";
import { cookies } from "next/headers";
import { resolveStorefrontContext } from "@/lib/storefront-context";

export default async function CheckoutPage() {
  const cookieStore = cookies();
  const [cart, customer, storefront] = await Promise.all([
    getCartFromRequest(),
    getCurrentCustomer(),
    resolveStorefrontContext(
      cookieStore.get("commerce_store_key")?.value,
      cookieStore.get("commerce_country")?.value,
    ),
  ]);
  const lineItems = cart?.lineItems ?? [];

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Checkout</h1>
          <p>Complete your contact, delivery, and payment details.</p>
        </div>
      </div>

      {cart === null || lineItems.length === 0 ? (
        <div className="panel">
          <p>Your cart is empty. Add some products before checkout.</p>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="panel">
            <CheckoutForm
              cartId={cart.id}
              email={customer?.email ?? cart.customerEmail}
              address={
                cart.shippingAddress ?? {
                  firstName: customer?.firstName,
                  lastName: customer?.lastName,
                }
              }
              signedIn={Boolean(customer)}
              addresses={customer?.addresses ?? []}
              defaultShippingAddressId={customer?.defaultShippingAddressId}
              defaultBillingAddressId={customer?.defaultBillingAddressId}
              country={storefront.country}
            />
          </div>

          <aside className="panel checkout-summary">
            <h2>Order summary</h2>
            <div className="cart-list">
              {lineItems.map((item: any) => (
                <div key={item.id} className="cart-item">
                  <Link href={getProductHref(item)}>
                    <img
                      src={item.variant.images?.[0]?.url ?? ""}
                      alt={item.name?.["en-US"] ?? "Product image"}
                    />
                  </Link>
                  <div>
                    <h3>
                      <Link href={getProductHref(item)}>
                        {item.name?.["en-US"] ||
                          Object.values(item.name ?? {})[0]}
                      </Link>
                    </h3>
                    <p>Quantity: {item.quantity}</p>
                    <p>
                      Price:{" "}
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
                </div>
              ))}
            </div>
            <DiscountCodeForm returnTo="/checkout" />
            <OrderTotals cart={cart} />
          </aside>
        </div>
      )}
    </div>
  );
}
