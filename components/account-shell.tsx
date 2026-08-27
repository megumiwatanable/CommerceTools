import Link from "next/link";
import { ReactNode } from "react";

const links = [
  { href: "/account", label: "Overview", key: "overview" },
  { href: "/account/orders", label: "Orders", key: "orders" },
  { href: "/account/wishlist", label: "Wishlist", key: "wishlist" },
  { href: "/account/addresses", label: "Addresses", key: "addresses" },
  { href: "/account/profile", label: "Profile & security", key: "profile" },
];

export default function AccountShell({
  customer,
  active,
  children,
}: {
  customer: any;
  active: string;
  children: ReactNode;
}) {
  return (
    <div className="account-layout">
      <aside className="account-sidebar">
        <div className="account-avatar">
          {(customer.firstName?.[0] || customer.email[0]).toUpperCase()}
        </div>
        <strong>
          {customer.firstName} {customer.lastName}
        </strong>
        <span>{customer.email}</span>
        <nav>
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={active === link.key ? "active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form method="post" action="/api/auth/logout">
          <button className="button-secondary" type="submit">
            Log out
          </button>
        </form>
      </aside>
      <div className="account-content">{children}</div>
    </div>
  );
}
