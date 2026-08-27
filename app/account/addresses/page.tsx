import AccountGuest from "@/components/account-guest";
import AccountShell from "@/components/account-shell";
import { getCurrentCustomer } from "@/lib/ct-customers";
import { cookies } from "next/headers";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import AddressCountryFields from "@/components/address-country-fields";

export default async function AddressesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return <AccountGuest />;
  const cookieStore = cookies();
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );
  const addresses = customer.addresses ?? [];
  return (
    <div className="account-page">
      <section className="page-heading">
        <p className="eyebrow">Address book</p>
        <h1>Saved addresses</h1>
        <p>Manage delivery and billing addresses used during checkout.</p>
      </section>
      <AccountShell customer={customer} active="addresses">
        <section className="panel account-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Saved details</p>
              <h2>Your addresses</h2>
            </div>
          </div>
          {addresses.length ? (
            <div className="address-list">
              {addresses.map((address) => (
                <article className="address-card" key={address.id}>
                  <div>
                    <strong>
                      {address.firstName} {address.lastName}
                    </strong>
                    <p>
                      {address.streetName}
                      <br />
                      {address.city}
                      {address.state ? `, ${address.state}` : ""}{" "}
                      {address.postalCode}
                      <br />
                      {address.country}
                    </p>
                  </div>
                  <div className="address-card-actions">
                    {customer.defaultShippingAddressId === address.id && (
                      <span className="address-badge">Shipping default</span>
                    )}
                    {customer.defaultBillingAddressId === address.id && (
                      <span className="address-badge">Billing default</span>
                    )}
                    <form method="post" action="/api/account">
                      <input
                        type="hidden"
                        name="action"
                        value="default-address"
                      />
                      <input
                        type="hidden"
                        name="addressId"
                        value={address.id}
                      />
                      <button className="text-button" type="submit">
                        Set as both defaults
                      </button>
                    </form>
                  </div>
                  <div className="address-management">
                    <details className="address-inline-editor">
                      <summary>Edit address</summary>
                      <form
                        method="post"
                        action="/api/account"
                        className="form-grid"
                      >
                        <input
                          type="hidden"
                          name="action"
                          value="edit-address"
                        />
                        <input
                          type="hidden"
                          name="addressId"
                          value={address.id}
                        />
                        <div className="form-group">
                          <label htmlFor={`edit-firstName-${address.id}`}>
                            First name
                          </label>
                          <input
                            className="input"
                            id={`edit-firstName-${address.id}`}
                            name="firstName"
                            defaultValue={address.firstName}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-lastName-${address.id}`}>
                            Last name
                          </label>
                          <input
                            className="input"
                            id={`edit-lastName-${address.id}`}
                            name="lastName"
                            defaultValue={address.lastName}
                            required
                          />
                        </div>
                        <div className="form-group form-span-2">
                          <label htmlFor={`edit-streetName-${address.id}`}>
                            Street address
                          </label>
                          <input
                            className="input"
                            id={`edit-streetName-${address.id}`}
                            name="streetName"
                            defaultValue={address.streetName}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-city-${address.id}`}>
                            City
                          </label>
                          <input
                            className="input"
                            id={`edit-city-${address.id}`}
                            name="city"
                            defaultValue={address.city}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`edit-postalCode-${address.id}`}>
                            Postal code
                          </label>
                          <input
                            className="input"
                            id={`edit-postalCode-${address.id}`}
                            name="postalCode"
                            defaultValue={address.postalCode}
                            required
                          />
                        </div>
                        <AddressCountryFields
                          idPrefix={`edit-${address.id}`}
                          defaultCountry={address.country}
                          defaultState={address.state}
                        />
                        <div>
                          <button className="button" type="submit">
                            Save address
                          </button>
                        </div>
                      </form>
                    </details>
                    <details className="address-delete-confirmation">
                      <summary>Delete address</summary>
                      <div>
                        <p>
                          This permanently removes the address from your
                          account.
                        </p>
                        <form method="post" action="/api/account">
                          <input
                            type="hidden"
                            name="action"
                            value="delete-address"
                          />
                          <input
                            type="hidden"
                            name="addressId"
                            value={address.id}
                          />
                          <button className="button-danger" type="submit">
                            Confirm delete
                          </button>
                        </form>
                      </div>
                    </details>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-copy">You haven’t saved an address yet.</p>
          )}
        </section>
        <section className="panel account-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">New address</p>
              <h2>Add an address</h2>
            </div>
          </div>
          <form method="post" action="/api/account" className="form-grid">
            <input type="hidden" name="action" value="address" />
            <div className="form-group">
              <label htmlFor="addressFirstName">First name</label>
              <input
                className="input"
                id="addressFirstName"
                name="firstName"
                defaultValue={customer.firstName}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="addressLastName">Last name</label>
              <input
                className="input"
                id="addressLastName"
                name="lastName"
                defaultValue={customer.lastName}
                required
              />
            </div>
            <div className="form-group form-span-2">
              <label htmlFor="streetName">Street address</label>
              <input
                className="input"
                id="streetName"
                name="streetName"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input className="input" id="city" name="city" required />
            </div>
            <div className="form-group">
              <label htmlFor="postalCode">Postal code</label>
              <input
                className="input"
                id="postalCode"
                name="postalCode"
                required
              />
            </div>
            <AddressCountryFields
              idPrefix="new-address"
              defaultCountry={storefront.country.code}
            />
            <div>
              <button className="button" type="submit">
                Save address
              </button>
            </div>
          </form>
        </section>
      </AccountShell>
    </div>
  );
}
