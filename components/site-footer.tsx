import Link from "next/link";
import { cookies } from "next/headers";
import StorefrontSelector from "@/components/storefront-selector";
import { resolveStorefrontContext } from "@/lib/storefront-context";

export default async function SiteFooter() {
  const cookieStore = cookies();
  const context = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="site-logo">
            Marketly
          </Link>
          <p>Thoughtfully chosen products for an easier, better everyday.</p>
        </div>
        <div>
          <h3>Shop</h3>
          <Link href="/products">All products</Link>
          <Link href="/cart">Shopping bag</Link>
          <Link href="/account">My account</Link>
        </div>
        <div>
          <h3>Customer care</h3>
          <a href="mailto:support@marketly.example">Contact us</a>
          <Link href="/account/addresses">Delivery addresses</Link>
          <Link href="/checkout">Checkout</Link>
        </div>
        <StorefrontSelector
          stores={context.stores}
          initialStoreKey={context.store.key}
          initialCountry={context.country.code}
        />
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Marketly. All rights reserved.
        </span>
        <span>Secure checkout · Simple returns</span>
      </div>
    </footer>
  );
}
