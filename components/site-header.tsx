import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="page-shell">
        <div className="brand-bar" style={{ padding: '0 20px' }}>
          <div>
            <Link href="/" style={{ fontSize: '1.2rem', fontWeight: 700, colxr: '#111827', display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M3 12h18" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 6h12v12H6z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              CommerceApp
            </Link>
          </div>
          <nav className="header-nav">
            <Link href="/products"><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}><svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Products</span></Link>
            <Link href="/search"><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}><svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>Search</span></Link>
            <Link href="/cart"><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}><svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-11L6 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1" fill="currentColor"/><circle cx="18" cy="20" r="1" fill="currentColor"/></svg>Cart</span></Link>
            <Link href="/account"><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}><svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c1-4 7-6 8-6s7 2 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Account</span></Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
