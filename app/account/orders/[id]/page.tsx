import { notFound } from "next/navigation";
import Link from "next/link";
import AccountGuest from "@/components/account-guest";
import AccountShell from "@/components/account-shell";
import OrderTotals from "@/components/order-totals";
import { getCurrentCustomer } from "@/lib/ct-customers";
import {
  canCustomerCancelOrder,
  canCustomerRequestReturn,
  getAuthorizedCustomerOrder,
} from "@/lib/ct-orders";
import { formatMoney } from "@/lib/money";
import { getProductHref } from "@/lib/product-link";

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCurrentCustomer();
  if (!customer) return <AccountGuest />;
  const order = await getAuthorizedCustomerOrder(params.id, customer);
  if (!order) notFound();

  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Order details</p>
        <h1>
          {order.orderNumber ?? `Order #${order.id.slice(-8).toUpperCase()}`}
        </h1>
        <p>
          Placed {formatOrderDate(order.createdAt)} · {order.orderState}
        </p>
      </section>
      <AccountShell customer={customer} active="orders">
        <section className="panel account-section order-detail-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Items</p>
              <h2>Order summary</h2>
            </div>
            <Link href="/account/orders" className="text-button">
              Back to orders
            </Link>
          </div>
          <div className="order-detail-items">
            {(order.lineItems ?? []).map((item: any) => (
              <div className="order-detail-item" key={item.id}>
                <Link href={getProductHref(item)}>
                  {item.variant?.images?.[0]?.url ? (
                    <img src={item.variant.images[0].url} alt="" />
                  ) : (
                    <span className="order-item-placeholder" />
                  )}
                </Link>
                <div>
                  <strong>
                    <Link href={getProductHref(item)}>
                      {item.name?.["en-US"] ||
                        Object.values(item.name ?? {})[0] ||
                        "Product"}
                    </Link>
                  </strong>
                  <span>SKU: {item.variant?.sku ?? "—"}</span>
                  <span>Quantity: {item.quantity}</span>
                </div>
                <strong>{formatMoney(item.totalPrice)}</strong>
              </div>
            ))}
          </div>
          <div className="order-detail-totals">
            <OrderTotals cart={order} />
          </div>
        </section>
        <div className="order-address-grid">
          <AddressPanel
            title="Shipping address"
            address={order.shippingAddress}
          />
          <AddressPanel
            title="Billing address"
            address={order.billingAddress}
          />
        </div>
        <ShipmentTracking order={order} />
        <section className="panel account-section order-actions-panel">
          <div>
            <h2>Order actions</h2>
            <p>
              Reordering creates a new cart using current product prices and
              availability.
            </p>
          </div>
          <div className="order-action-buttons">
            <form
              method="post"
              action={`/api/account/orders/${order.id}/reorder`}
            >
              <button className="button" type="submit">
                Reorder
              </button>
            </form>
            {canCustomerCancelOrder(order) && (
              <form
                method="post"
                action={`/api/account/orders/${order.id}/cancel`}
              >
                <button className="button-danger" type="submit">
                  Cancel order
                </button>
              </form>
            )}
            {canCustomerRequestReturn(order) && (
              <details className="address-delete-confirmation">
                <summary>Request a return</summary>
                <form method="post" action={`/api/account/orders/${order.id}/return`} className="form-group">
                  <label htmlFor="returnReason">Reason for return</label>
                  <textarea id="returnReason" name="reason" className="input" minLength={10} required />
                  <button className="button-secondary" type="submit">Send request</button>
                </form>
              </details>
            )}
          </div>
        </section>
      </AccountShell>
    </div>
  );
}

function ShipmentTracking({ order }: { order: any }) {
  const parcels = (order.shippingInfo?.deliveries ?? []).flatMap(
    (delivery: any) => delivery.parcels ?? [],
  );
  return (
    <section className="panel account-section">
      <p className="eyebrow">Delivery</p>
      <h2>Shipment tracking</h2>
      <p>Status: {order.shipmentState ?? "Not shipped"}</p>
      {parcels.length ? parcels.map((parcel: any) => (
        <div key={parcel.id}>
          <strong>{parcel.trackingData?.trackingId ?? "Tracking pending"}</strong>
          {parcel.trackingData?.carrier && <p>Carrier: {parcel.trackingData.carrier}</p>}
          {parcel.trackingData?.trackingId && parcel.trackingData?.providerTransaction && (
            <p>Reference: {parcel.trackingData.providerTransaction}</p>
          )}
        </div>
      )) : <p className="empty-copy">Tracking details will appear after shipment.</p>}
    </section>
  );
}

function AddressPanel({ title, address }: { title: string; address?: any }) {
  return (
    <section className="panel account-section">
      <p className="eyebrow">Address</p>
      <h2>{title}</h2>
      {address ? (
        <address>
          <strong>
            {address.firstName} {address.lastName}
          </strong>
          <span>{address.streetName}</span>
          <span>
            {address.city}
            {address.state ? `, ${address.state}` : ""} {address.postalCode}
          </span>
          <span>{address.country}</span>
          {address.phone && <span>{address.phone}</span>}
        </address>
      ) : (
        <p className="empty-copy">No address recorded.</p>
      )}
    </section>
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}
