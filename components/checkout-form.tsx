'use client';

import { FormEvent, useState } from 'react';

type ShippingMethod = {
  id: string;
  name: string;
  description?: string;
  price: string;
};

interface CheckoutFormProps {
  cartId: string;
  email?: string;
  address?: { firstName?: string; lastName?: string; streetName?: string; city?: string; postalCode?: string; country?: string };
}

export default function CheckoutForm({ cartId, email = '', address = {} }: CheckoutFormProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingError, setShippingError] = useState('');
  const [loadingShipping, setLoadingShipping] = useState(false);

  async function continueToShipping(event: FormEvent<HTMLFormElement>) {
    if (shippingMethods.length > 0) return;
    event.preventDefault();
    setLoadingShipping(true);
    setShippingError('');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch('/api/checkout/shipping-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    setLoadingShipping(false);

    if (!response.ok) {
      setShippingError(result.message ?? 'Unable to load shipping methods for this address.');
      return;
    }
    if (result.methods.length === 0) {
      setShippingError('No shipping methods are available for this address.');
      return;
    }
    setShippingMethods(result.methods);
  }

  return (
    <form method="post" action="/api/checkout" onSubmit={continueToShipping} className="checkout-form">
      <input type="hidden" name="cartId" value={cartId} />

      <section className="checkout-section">
        <div className="checkout-step"><span>1</span><h2>Contact</h2></div>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input className="input" id="email" name="email" type="email" defaultValue={email} required />
        </div>
      </section>

      <section className="checkout-section">
        <div className="checkout-step"><span>2</span><h2>Shipping address</h2></div>
        <div className="checkout-two-columns">
          <div className="form-group"><label htmlFor="firstName">First name</label><input className="input" id="firstName" name="firstName" defaultValue={address.firstName} required /></div>
          <div className="form-group"><label htmlFor="lastName">Last name</label><input className="input" id="lastName" name="lastName" defaultValue={address.lastName} required /></div>
        </div>
        <div className="form-group"><label htmlFor="streetName">Street address</label><input className="input" id="streetName" name="streetName" defaultValue={address.streetName} required /></div>
        <div className="checkout-two-columns">
          <div className="form-group"><label htmlFor="city">City</label><input className="input" id="city" name="city" defaultValue={address.city} required /></div>
          <div className="form-group"><label htmlFor="postalCode">Postal code</label><input className="input" id="postalCode" name="postalCode" defaultValue={address.postalCode} required /></div>
        </div>
        <div className="form-group"><label htmlFor="country">Country code</label><input className="input" id="country" name="country" defaultValue={address.country ?? 'US'} minLength={2} maxLength={2} required /></div>
      </section>

      {shippingMethods.length === 0 ? (
        <button className="button" type="submit" disabled={loadingShipping}>{loadingShipping ? 'Loading shipping methods…' : 'Continue to shipping'}</button>
      ) : (
        <>
          <section className="checkout-section">
            <div className="checkout-step"><span>3</span><h2>Shipping method</h2></div>
            <div className="checkout-options">
              {shippingMethods.map((method, index) => (
                <label className="checkout-option" key={method.id}>
                  <input type="radio" name="shippingMethodId" value={method.id} defaultChecked={index === 0} required />
                  <span><strong>{method.name}</strong>{method.description && <small>{method.description}</small>}</span>
                  <strong>{method.price}</strong>
                </label>
              ))}
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-step"><span>4</span><h2>Payment method</h2></div>
            <div className="checkout-options">
              <label className="checkout-option"><input type="radio" name="paymentMethod" value="cash-on-delivery" defaultChecked required /><span><strong>Cash on delivery</strong><small>Pay when your order is delivered.</small></span></label>
              <label className="checkout-option"><input type="radio" name="paymentMethod" value="bank-transfer" required /><span><strong>Bank transfer</strong><small>Payment instructions will be shown after placing the order.</small></span></label>
            </div>
          </section>
          <button className="button" type="submit">Place order</button>
        </>
      )}
      {shippingError && <p className="checkout-error" role="alert">{shippingError}</p>}
    </form>
  );
}
