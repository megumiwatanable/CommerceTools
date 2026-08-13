import Link from 'next/link';
import ProductFilters from "@/components/product-filters";
import {fetchCategories} from "@/lib/ct-services";

export default async function SiteHeader() {
  const categories = await fetchCategories();
  return (
    <header className="site-header">
      <div className="page-shell">
        <div className="brand-bar" style={{ padding: '0 20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M3 12h18" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 6h12v12H6z" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              CommerceApp
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.slice(0, 5).map((c: any) => {
                const name = (c.name && Object.values(c.name)[0]) || c.key || 'Category';
                return (
                  <Link key={c.id} href={`/products?category=${c.id}`} className="button-secondary" style={{ padding: '8px 12px' }}>
                    {name}
                  </Link>
                );
              })
            ) : (
              <></>
            )}
          </div>
          <form action="/products" method="get" className="header-search" role="search">
            <input name="q" placeholder="Search products, categories, brands..." className="input" defaultValue="" style={{ width: '540px', maxWidth: '60vw' }} />
          </form>

          <nav className="header-nav">
            <Link href="/cart"><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}><svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-11L6 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1" fill="currentColor"/><circle cx="18" cy="20" r="1" fill="currentColor"/></svg>Cart</span></Link>
            <Link href="/account"><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}><svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c1-4 7-6 8-6s7 2 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Account</span></Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
