import Link from "next/link";
import { fetchCategories } from "@/lib/ct-services";
import { getCartFromRequest } from "@/lib/ct-cart";
import { formatMoney } from "@/lib/money";
import { getProductHref } from "@/lib/product-link";
import { cookies } from "next/headers";
import FlashToast from "@/components/flash-toast";
import { getFlashMessage } from "@/lib/flash";

const categoryName = (category: any) =>
  (category.name && Object.values(category.name)[0]) ||
  category.key ||
  "Category";

export default async function SiteHeader() {
  const [categories, cart] = await Promise.all([
    fetchCategories(),
    getCartFromRequest(),
  ]);
  const lineItems = cart?.lineItems ?? [];
  const cookieStore = cookies();
  const signedIn = Boolean(cookieStore.get("commerce_customer_id")?.value);
  const flash = getFlashMessage(cookieStore.get("commerce_flash")?.value);

  return (
    <header className="site-header">
      {flash && <FlashToast flash={flash} />}
      <div className="page-shell">
        <div className="site-header-inner">
          <Link href="/" className="site-logo">
            <span className="logo-mark">
              <img
                src="https://framerusercontent.com/images/NfyHwnesOLrJ66ybRhTHzQt4rw.png?height=2737&width=2400"
                alt=""
              />
            </span>
            <span>Marketly</span>
            <em>store</em>
          </Link>
          <nav className="category-nav">
            <div className="nav-dropdown">
              <button
                type="button"
                className="category-trigger"
                aria-haspopup="menu"
              >
                <svg
                  className="category-list-icon"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M9 6h11M9 12h11M9 18h11"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 6h.01M4 12h.01M4 18h.01"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                Categories
              </button>
              <div className="mega-menu">
                <p className="eyebrow">Browse collections</p>
                <div className="category-tree">
                  {categories.map((category: any) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${category.id}`}
                      className={
                        category.parent
                          ? "category-item category-item-child"
                          : "category-item"
                      }
                    >
                      {categoryName(category)}
                    </Link>
                  ))}
                </div>
                <Link className="mega-menu-all" href="/products">
                  View all products →
                </Link>
              </div>
            </div>
          </nav>
          <form
            action="/search"
            method="get"
            className="header-search"
            role="search"
          >
            <input
              name="q"
              placeholder="Search the shop"
              className="input"
              aria-label="Search products"
            />
          </form>
          <nav className="header-nav">
            <Link href="/account/wishlist" className="header-icon-button" aria-label="Wishlist" title="Wishlist">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <div className="account-menu">
              <button type="button" className="header-icon-button" aria-label="My account" aria-haspopup="menu" title="My account">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
              <div className="account-dropdown" role="menu">
                {signedIn ? (
                  <>
                    <Link href="/account" role="menuitem">Overview</Link>
                    <Link href="/account/orders" role="menuitem">Orders</Link>
                    <Link href="/account/wishlist" role="menuitem">Wishlist</Link>
                    <Link href="/account/addresses" role="menuitem">Addresses</Link>
                    <Link href="/account/profile" role="menuitem">Profile &amp; security</Link>
                    <form method="post" action="/api/auth/logout">
                      <button type="submit" className="account-dropdown-logout">Log out</button>
                    </form>
                  </>
                ) : (
                  <>
                    <strong>Your account</strong>
                    <Link href="/account" role="menuitem">Sign in or create account</Link>
                  </>
                )}
              </div>
            </div>
            <div className="bag-menu">
              <button
                type="button"
                aria-label="My cart"
                className="bag-link"
                aria-haspopup="dialog"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M5 8h14l-1 12H6L5 8Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 9V6a3 3 0 0 1 6 0v3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                {lineItems.length > 0 && <b>{lineItems.length}</b>}
              </button>
              <div className="bag-preview">
                {lineItems.length ? (
                  <>
                    <div className="bag-preview-title">
                      <strong>My cart</strong>
                      <span>
                        {lineItems.length} item
                        {lineItems.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="bag-preview-items">
                      {lineItems.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="bag-preview-item">
                          <Link
                            href={getProductHref(item)}
                            className="bag-preview-product-image"
                          >
                            {item.variant.images?.[0]?.url ? (
                              <img src={item.variant.images[0].url} alt="" />
                            ) : (
                              <span className="bag-preview-image" />
                            )}
                          </Link>
                          <div>
                            <strong>
                              <Link
                                href={getProductHref(item)}
                                className="product-name-link"
                              >
                                {item.name?.["en-US"] ||
                                  Object.values(item.name ?? {})[0] ||
                                  "Product"}
                              </Link>
                            </strong>
                            <span>
                              Qty {item.quantity} ·{" "}
                              {formatMoney(
                                item.price?.discounted?.value ??
                                  item.price?.value,
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bag-preview-total">
                      <span>Subtotal</span>
                      <strong>{formatMoney(cart?.totalPrice)}</strong>
                    </div>
                    <Link href="/cart" className="button">
                      View my cart
                    </Link>
                  </>
                ) : (
                  <>
                    <strong>Your cart is empty</strong>
                    <p>Add something you love to get started.</p>
                    <Link href="/products" className="button">
                      Shop products
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
