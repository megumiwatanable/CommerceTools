import { getCartFromRequest } from '@/lib/ct-cart';
import Link from 'next/link';

export default async function CartPage() {
  const cart = await getCartFromRequest();
  const lineItems = cart?.lineItems ?? [];
  const totalPrice = cart?.totalPrice?.centAmount ? `${(cart.totalPrice.centAmount / 100).toFixed(2)} ${cart.totalPrice.currencyCode}` : '0.00';

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
              <img src={item.variant.images?.[0]?.url ?? ''} alt={item.name?.en ?? 'Product image'} />
              <div className="cart-item-details">
                <h3>{item.name?.en}</h3>
                <p>SKU: {item.variant.sku}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Price: {(item.price?.value?.centAmount ?? 0) / 100} {item.price?.value?.currencyCode}</p>
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
