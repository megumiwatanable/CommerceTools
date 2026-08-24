import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'Commerce App',
  description: 'Storefront B2C connected to commercetools',
};

// Category navigation and storefront data are loaded from commercetools per request.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="page-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
