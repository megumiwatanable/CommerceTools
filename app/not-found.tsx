import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Page not found</h1>
          <p>The page you were looking for could not be found.</p>
        </div>
      </div>

      <div className="panel">
        <p>Please check the URL or return to the homepage.</p>
        <Link href="/" className="button" style={{ marginTop: '16px' }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
