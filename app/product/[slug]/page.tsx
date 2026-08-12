import { getProductBySlug } from '@/lib/ct-services';
import ProductCard from '@/components/product-card';
import { notFound } from 'next/navigation';

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const variant = product.masterVariant;

  const priceData = variant?.prices?.[0]?.value;
  const price = priceData ? `${priceData.centAmount / 100} ${priceData.currencyCode}` : 'Contact us';

  const productName = product.name?.['en-US'] || product.name?.['en-GB'] || 'Product';
  const productDescription = product.description?.['en-US'] || product.description?.['en-GB'] || 'Product details';

  const imageUrl = variant?.images?.[0]?.url;
  const sku = variant?.sku || 'N/A';

  const availableQuantity = variant?.availability?.availableQuantity || 0;
  const isInStock = availableQuantity > 0;

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: '1.3fr 0.9fr', gap: '28px' }}>
        <div className="product-card">
          {imageUrl ? (
            <img
              className="product-detail-image"
              src={imageUrl}
              alt={productName}
            />
          ) : null}
        </div>

        <div className="panel">
          <div>
            <h1 className="product-title">{productName}</h1>
            <p className="product-price">{price}</p>
            <p className="product-meta">SKU: {sku}</p>
            <p className="product-meta">
              Status: {isInStock ? `In Stock (${availableQuantity} available)` : 'Out of Stock'}
            </p>
            <p style={{ marginTop: '16px', lineHeight: '1.7' }}>{productDescription}</p>
          </div>
          <form method="post" action="/api/cart">
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="sku" value={sku} />

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="quantity" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Quantity:
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                defaultValue="1"
                min="1"
                max={availableQuantity || 99}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                disabled={!isInStock}
              />
              {!isInStock && (
                <p style={{ color: '#dc3545', marginTop: '8px', fontSize: '14px' }}>
                  This product is currently out of stock.
                </p>
              )}
            </div>

            <button
              className="button"
              type="submit"
              disabled={!isInStock}
              style={{
                opacity: isInStock ? 1 : 0.6,
                cursor: isInStock ? 'pointer' : 'not-allowed'
              }}
            >
              {isInStock ? 'Add to cart' : 'Out of Stock'}
            </button>
          </form>
        </div>
      </div>

      <section style={{ marginTop: '32px' }}>
        <h2 className="section-title">You may also like</h2>
        <div className="grid grid-3">
          <ProductCard key={product.id} product={product} />
        </div>
      </section>
    </div>
  );
}