import { getCartFromRequest } from '@/lib/ct-cart';
import CheckoutForm from '@/components/checkout-form';
import { formatMoney } from '@/lib/money';

export default async function CheckoutPage({ searchParams }: { searchParams: { error?: string } }) {
  const cart = await getCartFromRequest();
  const lineItems = cart?.lineItems ?? [];
  const totalPrice = formatMoney(cart?.totalPrice);

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Checkout</h1>
          <p>Complete your contact, delivery, and payment details.</p>
        </div>
      </div>

      {lineItems.length === 0 ? (
        <div className="panel">
          <p>Your cart is empty. Add some products before checkout.</p>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="panel">
            {searchParams.error && <p className="checkout-error">Please review your checkout details and try again.</p>}
            <CheckoutForm
              cartId={cart.id}
              email={cart.customerEmail}
              address={cart.shippingAddress}
            />
          </div>

          <aside className="panel checkout-summary">
            <h2>Order summary</h2>
            <div className="cart-list">
              {lineItems.map((item: any) => (
                <div key={item.id} className="cart-item">
                  <img src={item.variant.images?.[0]?.url ?? ''} alt={item.name?.['en-US'] ?? 'Product image'} />
                  <div>
                    <h3>{item.name?.['en-US']}</h3>
                    <p>Quantity: {item.quantity}</p>
                    <p>
                      Price: {item.price?.discounted && <s className="price-original">{formatMoney(item.price.value)}</s>}{' '}
                      <span className={item.price?.discounted ? 'price-discounted' : undefined}>
                        {formatMoney(item.price?.discounted?.value ?? item.price?.value)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="panel" style={{ marginTop: '16px' }}>
              <h3>Total</h3>
              <p>{totalPrice}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
