import { getCartFromRequest } from '@/lib/ct-cart';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';

export default async function CartPage({ searchParams }: { searchParams: { error?: string; cart_replaced?: string } }) {
  const cart = await getCartFromRequest();
  const lineItems = cart?.lineItems ?? [];
  const totalPrice = formatMoney(cart?.totalPrice);

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Shopping Cart</h1>
          <p>Review your cart before checkout.</p>
        </div>
        <Link href="/checkout" className="button">
          Checkout
        </Link>
      </div>

      {searchParams.cart_replaced === 'price_context_changed' && (
        <p className="panel">A new cart was started because this product uses a different price country or currency.</p>
      )}
      {searchParams.error && (
        <p className="panel">This item could not be added to your cart. Please try again.</p>
      )}

      {lineItems.length === 0 ? (
        <div className="panel">
          <p>Your cart is empty.</p>
          <Link href="/products" className="button" style={{ marginTop: '16px' }}>
            Shop products
          </Link>
        </div>
      ) : (
        <div className="cart-list">
          {lineItems.map((item: any) => (
            <div key={item.id} className="cart-item">
              <img src={item.variant.images?.[0]?.url ?? ''} alt={item.name?.['en-US'] ?? 'Product image'} />
              <div className="cart-item-details">
                <h3>{item.name?.['en-US']}</h3>
                <p>SKU: {item.variant.sku}</p>
                <p>Quantity: {item.quantity}</p>
                <p>
                  Price: {item.price?.discounted && <s className="price-original">{formatMoney(item.price.value)}</s>}{' '}
                  <span className={item.price?.discounted ? 'price-discounted' : undefined}>
                    {formatMoney(item.price?.discounted?.value ?? item.price?.value)}
                  </span>
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <form method="post" action="/api/cart">
                  <input type="hidden" name="action" value="update" />
                  <input type="hidden" name="lineItemId" value={item.id} />
                  <input type="number" name="quantity" min="1" defaultValue={item.quantity} className="input" />
                  <button type="submit" className="button-secondary">
                    Update
                  </button>
                </form>
                <form method="post" action="/api/cart">
                  <input type="hidden" name="action" value="remove" />
                  <input type="hidden" name="lineItemId" value={item.id} />
                  <button type="submit" className="button-secondary">
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}

          <div className="panel" style={{ marginTop: '16px' }}>
            <h2>Total</h2>
            <p>{totalPrice}</p>
          </div>
        </div>
      )}
    </div>
  );
}
