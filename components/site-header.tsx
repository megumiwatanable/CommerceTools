import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-shell">
        <div className="brand-bar" style={{ padding: 0 }}>
          <div>
            <Link href="/" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>
              CommerceApp
            </Link>
          </div>
          <nav className="header-nav">
            <Link href="/products">Products</Link>
            <Link href="/search">Search</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/account">Account</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
