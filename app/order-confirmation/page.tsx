import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrderTotals from "@/components/order-totals";
import { apiRoot } from "@/lib/ct-client";
import { formatMoney } from "@/lib/money";
import { readOrderConfirmationToken } from "@/lib/order-confirmation-token";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  const orderId = readOrderConfirmationToken(
    cookies().get("commerce_confirmation_order_id")?.value,
  );
  if (!orderId) redirect("/account/orders");

  let order: any;
  try {
    order = (await apiRoot.orders().withId({ ID: orderId }).get().execute()).body;
  } catch {
    redirect("/account/orders");
  }
  const reference = order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`;
  const bankTransfer = searchParams.payment === "bank-transfer";

  return (
    <div>
      <div className="brand-bar">
        <div>
          <p className="eyebrow">Order confirmed</p>
          <h1 className="section-title">Order confirmation</h1>
          <p>
            Order {reference} was submitted. A confirmation was sent to{" "}
            {order.customerEmail}.
          </p>
        </div>
      </div>
      {bankTransfer && (
        <div className="panel notice notice-success">
          <strong>Bank transfer selected</strong>
          <p>
            Use order {reference} as the transfer reference. The store will
            send account details and confirm payment separately.
          </p>
        </div>
      )}
      <div className="checkout-layout">
        <section className="panel">
          <h2>Order {reference}</h2>
          <div className="order-detail-items">
            {(order.lineItems ?? []).map((item: any) => (
              <div className="order-detail-item" key={item.id}>
                {item.variant?.images?.[0]?.url ? (
                  <img src={item.variant.images[0].url} alt="" />
                ) : (
                  <span className="order-item-placeholder" />
                )}
                <div>
                  <strong>
                    {item.name?.["en-US"] ??
                      Object.values(item.name ?? {})[0] ??
                      "Product"}
                  </strong>
                  <span>Quantity: {item.quantity}</span>
                </div>
                <strong>{formatMoney(item.totalPrice)}</strong>
              </div>
            ))}
          </div>
          <OrderTotals cart={order} />
        </section>
        <aside className="panel checkout-summary">
          <h2>Delivery details</h2>
          <OrderAddress address={order.shippingAddress} />
          <h3>Payment</h3>
          <p>{bankTransfer ? "Bank transfer" : "Cash on delivery"}</p>
          <Link href="/products" className="button">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function OrderAddress({ address }: { address?: any }) {
  if (!address) return <p>No delivery address recorded.</p>;
  return (
    <address>
      <strong>{[address.firstName, address.lastName].filter(Boolean).join(" ")}</strong>
      <span>{address.streetName}</span>
      <span>
        {address.city}{address.state ? `, ${address.state}` : ""}{" "}
        {address.postalCode}
      </span>
      <span>{address.country}</span>
    </address>
  );
}
