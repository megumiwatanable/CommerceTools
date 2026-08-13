import Link from 'next/link';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const variant = product.masterVariant;
  const priceData = variant?.prices?.[0]?.value;
  const price = priceData ? `${priceData.centAmount / 100} ${priceData.currencyCode}` : 'Contact us';  const imageUrl = variant.images?.[0]?.url;
  const slug = product.slug?.['en-US'] || product.id;

  return (
    <article className="product-card">
      <Link href={`/product/${slug}`} className="product-link" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="product-image">
          {imageUrl ? <img src={imageUrl} alt={product.name?.['en-US'] ?? 'Product'} /> : null}
        </div>
        <h3 className="product-card-title">{product.name?.['en-US']}</h3>
      </Link>

      <div className="product-card-body">
        <p className="product-price">
          <svg className="icon icon-price" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 1v22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 5H7v6a5 5 0 0010 0V5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {price}
        </p>
        <p className="product-meta">SKU: {variant.sku}</p>

        <div className="product-card-actions">
          <form method="post" action="/api/cart" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="sku" value={variant.sku} />
            <input
              type="number"
              name="quantity"
              defaultValue={1}
              min={1}
              className="input"
              style={{ width: '80px' }}
            />
            <button type="submit" className="button" style={{ padding: '10px 12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <svg className="icon icon-cart" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M6 6h15l-1.5 9h-11L6 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
              Add to Cart
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
