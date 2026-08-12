import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Commerce App',
  description: 'Storefront B2C connected to commercetools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="page-shell">
          <SiteHeader />
          <main>{children}</main>
          <footer className="site-footer">
            <p>Commerce App kết nối commercetools.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
