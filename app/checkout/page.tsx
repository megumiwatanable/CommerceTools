import { getCartFromRequest } from '@/lib/ct-cart';
import CheckoutForm from '@/components/checkout-form';

export default async function CheckoutPage() {
  const cart = await getCartFromRequest();
  const lineItems = cart?.lineItems ?? [];
  const totalPrice = cart?.totalPrice?.centAmount ? `${(cart.totalPrice.centAmount / 100).toFixed(2)} ${cart.totalPrice.currencyCode}` : '0.00';

  return (
    <div>
      <div className="brand-bar">
        <div>
          <h1 className="section-title">Checkout</h1>
          <p>Enter your shipping details and place your order.</p>
        </div>
      </div>

      {lineItems.length === 0 ? (
        <div className="panel">
          <p>Your cart is empty. Add some products before checkout.</p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1fr 0.9fr', gap: '24px' }}>
          <div className="panel">
            <h2>Order summary</h2>
            <div className="cart-list">
              {lineItems.map((item: any) => (
                <div key={item.id} className="cart-item">
                  <div>
                    <h3>{item.name?.en}</h3>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: {(item.price?.value?.centAmount ?? 0) / 100} {item.price?.value?.currencyCode}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="panel" style={{ marginTop: '16px' }}>
              <h3>Total</h3>
              <p>{totalPrice}</p>
            </div>
          </div>

          <div className="panel">
            <CheckoutForm cartId={cart.id} total={totalPrice} />
          </div>
        </div>
      )}
    </div>
  );
}
