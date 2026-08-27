import Link from "next/link";
import AccountGuest from "@/components/account-guest";
import AccountShell from "@/components/account-shell";
import { getCurrentCustomer } from "@/lib/ct-customers";
import { fetchCustomerOrders } from "@/lib/ct-services";
import { formatMoney } from "@/lib/money";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const customer = await getCurrentCustomer();
  if (!customer) return <AccountGuest />;
  const limit = 8;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const orders = await fetchCustomerOrders({
    customerId: customer.id,
    customerEmail: customer.email,
    limit,
    offset: (page - 1) * limit,
  });
  const pages = Math.max(1, Math.ceil((orders.total ?? 0) / limit));

  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Purchase history</p>
        <h1>My orders</h1>
        <p>Track purchases and open an order for its complete details.</p>
      </section>
      <AccountShell customer={customer} active="orders">
        <section className="panel account-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">All purchases</p>
              <h2>Order history</h2>
            </div>
            <span className="order-count">
              {orders.total ?? orders.results.length} orders
            </span>
          </div>
          {orders.results.length ? (
            <div className="order-summary-list">
              {orders.results.map((order: any) => (
                <article className="order-summary-card" key={order.id}>
                  <div>
                    <span>Order</span>
                    <strong>
                      {order.orderNumber ??
                        `#${order.id.slice(-8).toUpperCase()}`}
                    </strong>
                    <small>{formatOrderDate(order.createdAt)}</small>
                  </div>
                  <div>
                    <span>Items</span>
                    <strong>
                      {order.lineItems?.reduce(
                        (sum: number, item: any) => sum + item.quantity,
                        0,
                      ) ?? 0}
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
          {pages > 1 && (
            <nav className="order-pagination" aria-label="Order history pages">
              {page > 1 && (
                <Link href={`/account/orders?page=${page - 1}`}>← Newer</Link>
              )}
              <span>
                Page {Math.min(page, pages)} of {pages}
              </span>
              {page < pages && (
                <Link href={`/account/orders?page=${page + 1}`}>Older →</Link>
              )}
            </nav>
          )}
        </section>
      </AccountShell>
    </div>
  );
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
