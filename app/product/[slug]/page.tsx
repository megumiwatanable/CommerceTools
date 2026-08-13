import { getProductBySlug, searchProducts } from '@/lib/ct-services';
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

  // fetch related products (by first category or by name token)
  let relatedProducts: any[] = [];
  try {
    const categoryId = product.categories?.[0]?.id || product.categories?.[0]?.obj?.id || product.categories?.[0]?.key;
    const searchRes = await searchProducts({
      query: '',
      category: categoryId,
      limit: 6,
    });
    relatedProducts = (searchRes?.results || []).filter((p: any) => p.id !== product.id).slice(0, 3);
    if (relatedProducts.length === 0) {
      const nameToken = productName.split(' ')[0] || '';
      const searchRes2 = await searchProducts({ query: nameToken, limit: 6 });
      relatedProducts = (searchRes2?.results || []).filter((p: any) => p.id !== product.id).slice(0, 3);
    }
  } catch (e) {
    relatedProducts = [];
  }

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 420px', gap: '28px' }}>
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
          <form method="post" action="/api/cart" className="form-group">
            <input type="hidden" name="action" value="add" />
            <input type="hidden" name="sku" value={sku} />

            <label htmlFor="quantity">Quantity</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              defaultValue={1}
              min={1}
              max={availableQuantity || 99}
              className="input"
              disabled={!isInStock}
            />

            {!isInStock && (
              <p style={{ color: '#dc3545', marginTop: '8px', fontSize: '14px' }}>
                This product is currently out of stock.
              </p>
            )}

            <div style={{ marginTop: '14px' }}>
              <button className="button" type="submit" disabled={!isInStock}>
                {isInStock ? 'Add to cart' : 'Out of Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <section style={{ marginTop: '32px' }}>
        <h2 className="section-title">You may also like</h2>
        <div className="grid grid-3">
          {relatedProducts.length === 0 ? (
            <p>No recommendations available.</p>
          ) : (
            relatedProducts.map((p: any) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>
    </div>
  );
}