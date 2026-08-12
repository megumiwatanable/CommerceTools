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
      {imageUrl ? <img src={imageUrl} alt={product.name?.['en-US'] ?? 'Product'} /> : null}
      <h3>{product.name?.['en-US']}</h3>
      <p className="product-price">{price}</p>
      <p className="product-meta">SKU: {variant.sku}</p>
      <Link href={`/product/${slug}`} className="button" style={{ marginTop: '16px', display: 'inline-block' }}>
        View details
      </Link>
    </article>
  );
}
