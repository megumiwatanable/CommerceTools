export default function DiscountCodeForm({
  returnTo = "/cart",
}: {
  returnTo?: "/cart" | "/checkout";
}) {
  return (
    <form method="post" action="/api/cart" className="discount-code-form">
      <input type="hidden" name="action" value="apply-discount" />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label htmlFor={`discount-${returnTo}`}>Discount code</label>
      <div>
        <input
          className="input"
          id={`discount-${returnTo}`}
          name="discountCode"
          placeholder="Enter code"
        />
        <button className="button-secondary" type="submit">
          Apply
        </button>
      </div>
    </form>
  );
}
