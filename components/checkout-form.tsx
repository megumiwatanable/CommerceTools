interface CheckoutFormProps {
  cartId: string;
  total: string;
}

export default function CheckoutForm({ cartId, total }: CheckoutFormProps) {
  return (
    <form method="post" action="/api/checkout">
      <input type="hidden" name="cartId" value={cartId} />
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required />
      </div>
      <div className="form-group">
        <label htmlFor="firstName">First name</label>
        <input className="input" id="firstName" name="firstName" type="text" required />
      </div>
      <div className="form-group">
        <label htmlFor="lastName">Last name</label>
        <input className="input" id="lastName" name="lastName" type="text" required />
      </div>
      <div className="form-group">
        <label htmlFor="streetName">Street</label>
        <input className="input" id="streetName" name="streetName" type="text" required />
      </div>
      <div className="form-group">
        <label htmlFor="city">City</label>
        <input className="input" id="city" name="city" type="text" required />
      </div>
      <div className="form-group">
        <label htmlFor="postalCode">Postal code</label>
        <input className="input" id="postalCode" name="postalCode" type="text" required />
      </div>
      <div className="form-group">
        <label htmlFor="country">Country</label>
        <input className="input" id="country" name="country" type="text" defaultValue="VN" required />
      </div>
      <div style={{ marginTop: '16px' }}>
        <button className="button" type="submit">Place order</button>
      </div>
    </form>
  );
}
