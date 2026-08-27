import Link from "next/link";
import AccountGuest from "@/components/account-guest";
import AccountShell from "@/components/account-shell";
import { getCurrentCustomer } from "@/lib/ct-customers";
import { fetchCustomerOrders } from "@/lib/ct-services";
import { formatMoney } from "@/lib/money";

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <AccountGuest />;
  const orders = await fetchCustomerOrders({
    customerId: customer.id,
    customerEmail: customer.email,
    limit: 3,
  });

  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Your space</p>
        <h1>My account</h1>
        <p>Review recent orders and manage your account details.</p>
      </section>
      <AccountShell customer={customer} active="overview">
        <div className="account-overview-grid">
          <Link className="account-overview-card" href="/account/orders">
            <span>Orders</span>
            <strong>{orders.total ?? orders.results.length}</strong>
            <small>View order history →</small>
          </Link>
          <Link className="account-overview-card" href="/account/addresses">
            <span>Saved addresses</span>
            <strong>{customer.addresses?.length ?? 0}</strong>
            <small>Manage addresses →</small>
          </Link>
          <Link className="account-overview-card" href="/account/profile">
            <span>Account</span>
            <strong>{customer.firstName || "Profile"}</strong>
            <small>Edit profile & security →</small>
          </Link>
        </div>
        <section className="panel account-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2>Recent orders</h2>
            </div>
            <Link href="/account/orders" className="text-button">
              View all
            </Link>
          </div>
          {orders.results.length ? (
            <div className="order-summary-list">
              {orders.results.map((order: any) => (
                <article className="order-summary-card" key={order.id}>
                  <div>
                    <span>{formatOrderDate(order.createdAt)}</span>
                    <strong>
                      {order.orderNumber ??
                        `#${order.id.slice(-8).toUpperCase()}`}
                    </strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong className="order-status">{order.orderState}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatMoney(order.totalPrice)}</strong>
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="button-secondary"
                  >
                    View details
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-copy">You haven’t placed an order yet.</p>
          )}
        </section>
      </AccountShell>
    </div>
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
