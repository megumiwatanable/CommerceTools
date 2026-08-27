"use client";

import { FormEvent, useMemo, useState } from "react";
import AddressCountryFields from "@/components/address-country-fields";

type ShippingMethod = {
  id: string;
  name: string;
  description?: string;
  price: string;
};

type Address = {
  id?: string;
  firstName?: string;
  lastName?: string;
  streetName?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
};

interface CheckoutFormProps {
  cartId: string;
  email?: string;
  address?: Address;
  signedIn?: boolean;
  addresses?: Address[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;
  country: { code: string; name: string };
}

export default function CheckoutForm({
  cartId,
  email = "",
  address = {},
  signedIn = false,
  addresses = [],
  defaultShippingAddressId,
  defaultBillingAddressId,
  country,
}: CheckoutFormProps) {
  const savedAddresses = addresses.filter((item) => item.id);
  const initialAddressId = savedAddresses.some(
    (item) => item.id === defaultShippingAddressId,
  )
    ? defaultShippingAddressId!
    : (savedAddresses[0]?.id ?? "new");
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddressId);
  const [billingAddressId, setBillingAddressId] = useState("same");
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingError, setShippingError] = useState("");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState("");

  const selectedAddress = useMemo(
    () => savedAddresses.find((item) => item.id === selectedAddressId),
    [savedAddresses, selectedAddressId],
  );
  const usingNewAddress = selectedAddressId === "new";
  const selectedBillingAddress = savedAddresses.find(
    (item) => item.id === billingAddressId,
  );

  function resetShipping() {
    setShippingMethods([]);
    setSelectedShippingMethodId("");
    setShippingError("");
  }

  function changeAddress(addressId: string) {
    setSelectedAddressId(addressId);
    resetShipping();
  }

  function changeBillingAddress(addressId: string) {
    setBillingAddressId(addressId);
    resetShipping();
  }

  async function loadShipping(
    form: HTMLFormElement,
    shippingMethodId?: string,
  ) {
    const payload = Object.fromEntries(new FormData(form).entries());
    if (shippingMethodId) payload.shippingMethodId = shippingMethodId;
    const response = await fetch("/api/checkout/shipping-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        result.message ?? "Unable to load shipping methods for this address.",
      );
    if (result.cart)
      window.dispatchEvent(
        new CustomEvent("checkout-cart-updated", { detail: result.cart }),
      );
    return result;
  }

  async function continueToShipping(event: FormEvent<HTMLFormElement>) {
    if (shippingMethods.length > 0) return;
    event.preventDefault();
    if (loadingShipping) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    setLoadingShipping(true);
    setShippingError("");
    try {
      const result = await loadShipping(form);
      const methods = Array.isArray(result.methods) ? result.methods : [];
      if (methods.length === 0)
        setShippingError("No shipping methods are available for this address.");
      else {
        setShippingMethods(methods);
        setSelectedShippingMethodId(result.selectedMethodId ?? methods[0].id);
      }
    } catch (error) {
      setShippingError(
        error instanceof Error
          ? error.message
          : "Unable to connect to checkout. Please try again.",
      );
    } finally {
      setLoadingShipping(false);
    }
  }

  async function changeShippingMethod(
    form: HTMLFormElement,
    shippingMethodId: string,
  ) {
    const previousShippingMethodId = selectedShippingMethodId;
    setSelectedShippingMethodId(shippingMethodId);
    setLoadingShipping(true);
    setShippingError("");
    try {
      await loadShipping(form, shippingMethodId);
    } catch (error) {
      setSelectedShippingMethodId(previousShippingMethodId);
      setShippingError(
        error instanceof Error
          ? error.message
          : "Unable to update the shipping method.",
      );
    } finally {
      setLoadingShipping(false);
    }
  }

  return (
    <form
      method="post"
      action="/api/checkout"
      onSubmit={continueToShipping}
      className="checkout-form"
    >
      <input type="hidden" name="cartId" value={cartId} />
      <section className="checkout-section">
        <div className="checkout-step">
          <span>1</span>
          <h2>Contact</h2>
        </div>
        {signedIn ? (
          <div className="checkout-account-contact">
            <span>Signed in as</span>
            <strong>{email}</strong>
            <input type="hidden" name="email" value={email} />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              required
            />
          </div>
        )}
      </section>

      <section className="checkout-section">
        <div className="checkout-step">
          <span>2</span>
          <h2>Shipping address</h2>
        </div>
        {savedAddresses.length > 0 && (
          <div className="checkout-address-book">
            {savedAddresses.map((item) => (
              <label
                className={`checkout-address-card ${selectedAddressId === item.id ? "selected" : ""}`}
                key={item.id}
              >
                <input
                  type="radio"
                  name="addressChoice"
                  value={item.id}
                  checked={selectedAddressId === item.id}
                  onChange={() => changeAddress(item.id!)}
                />
                <span>
                  <strong>
                    {item.firstName} {item.lastName}
                  </strong>
                  <small>
                    {item.streetName}
                    <br />
                    {item.city}
                    {item.state ? `, ${item.state}` : ""} {item.postalCode}
                    <br />
                    {item.country}
                  </small>
                </span>
                {item.id === defaultShippingAddressId && <em>Default</em>}
              </label>
            ))}
            <label
              className={`checkout-address-card checkout-new-address ${usingNewAddress ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="addressChoice"
                value="new"
                checked={usingNewAddress}
                onChange={() => changeAddress("new")}
              />
              <span>
                <strong>Use a new address</strong>
                <small>
                  Enter a different delivery address for this order.
                </small>
              </span>
            </label>
          </div>
        )}

        {selectedAddress ? (
          <>
            <input
              type="hidden"
              name="firstName"
              value={selectedAddress.firstName ?? ""}
            />
            <input
              type="hidden"
              name="lastName"
              value={selectedAddress.lastName ?? ""}
            />
            <input
              type="hidden"
              name="streetName"
              value={selectedAddress.streetName ?? ""}
            />
            <input
              type="hidden"
              name="city"
              value={selectedAddress.city ?? ""}
            />
            <input
              type="hidden"
              name="postalCode"
              value={selectedAddress.postalCode ?? ""}
            />
            <input
              type="hidden"
              name="country"
              value={selectedAddress.country ?? ""}
            />
            <input
              type="hidden"
              name="state"
              value={selectedAddress.state ?? ""}
            />
          </>
        ) : (
          <NewAddressFields address={address} defaultCountry={country.code} />
        )}
      </section>

      <section className="checkout-section">
        <div className="checkout-step">
          <span>3</span>
          <h2>Billing address</h2>
        </div>
        <div className="checkout-address-book">
          <label
            className={`checkout-address-card checkout-new-address ${billingAddressId === "same" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="billingAddressMode"
              value="same"
              checked={billingAddressId === "same"}
              onChange={() => changeBillingAddress("same")}
            />
            <span>
              <strong>Same as shipping address</strong>
              <small>Use the selected delivery address for billing.</small>
            </span>
          </label>
          {savedAddresses.map((item) => (
            <label
              className={`checkout-address-card ${billingAddressId === item.id ? "selected" : ""}`}
              key={`billing-${item.id}`}
            >
              <input
                type="radio"
                name="billingAddressMode"
                value={item.id}
                checked={billingAddressId === item.id}
                onChange={() => changeBillingAddress(item.id!)}
              />
              <span>
                <strong>
                  {item.firstName} {item.lastName}
                </strong>
                <small>
                  {item.streetName}
                  <br />
                  {item.city}
                  {item.state ? `, ${item.state}` : ""} {item.postalCode}
                  <br />
                  {item.country}
                </small>
              </span>
              {item.id === defaultBillingAddressId && <em>Default billing</em>}
            </label>
          ))}
          <label
            className={`checkout-address-card checkout-new-address ${billingAddressId === "new" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="billingAddressMode"
              value="new"
              checked={billingAddressId === "new"}
              onChange={() => changeBillingAddress("new")}
            />
            <span>
              <strong>Use a new billing address</strong>
              <small>Enter a different billing address for this order.</small>
            </span>
          </label>
        </div>
        {selectedBillingAddress && (
          <>
            <input
              type="hidden"
              name="billingFirstName"
              value={selectedBillingAddress.firstName ?? ""}
            />
            <input
              type="hidden"
              name="billingLastName"
              value={selectedBillingAddress.lastName ?? ""}
            />
            <input
              type="hidden"
              name="billingStreetName"
              value={selectedBillingAddress.streetName ?? ""}
            />
            <input
              type="hidden"
              name="billingCity"
              value={selectedBillingAddress.city ?? ""}
            />
            <input
              type="hidden"
              name="billingPostalCode"
              value={selectedBillingAddress.postalCode ?? ""}
            />
            <input
              type="hidden"
              name="billingCountry"
              value={selectedBillingAddress.country ?? ""}
            />
            <input
              type="hidden"
              name="billingState"
              value={selectedBillingAddress.state ?? ""}
            />
          </>
        )}
        {billingAddressId === "new" && (
          <NewAddressFields
            address={{}}
            defaultCountry={country.code}
            prefix="billing"
          />
        )}
      </section>

      {shippingMethods.length === 0 ? (
        <button className="button" type="submit" disabled={loadingShipping}>
          {loadingShipping
            ? "Loading shipping methods…"
            : "Continue to shipping"}
        </button>
      ) : (
        <>
          <section className="checkout-section">
            <div className="checkout-step">
              <span>4</span>
              <h2>Shipping method</h2>
            </div>
            <div className="checkout-options">
              {shippingMethods.map((method) => (
                <label className="checkout-option" key={method.id}>
                  <input
                    type="radio"
                    name="shippingMethodId"
                    value={method.id}
                    checked={selectedShippingMethodId === method.id}
                    onChange={(event) =>
                      changeShippingMethod(event.currentTarget.form!, method.id)
                    }
                    required
                  />
                  <span>
                    <strong>{method.name}</strong>
                    {method.description && <small>{method.description}</small>}
                  </span>
                  <strong>{method.price}</strong>
                </label>
              ))}
            </div>
          </section>
          <section className="checkout-section">
            <div className="checkout-step">
              <span>5</span>
              <h2>Payment method</h2>
            </div>
            <div className="checkout-options">
              <label className="checkout-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash-on-delivery"
                  defaultChecked
                  required
                />
                <span>
                  <strong>Cash on delivery</strong>
                  <small>Pay when your order is delivered.</small>
                </span>
              </label>
              <label className="checkout-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank-transfer"
                  required
                />
                <span>
                  <strong>Bank transfer</strong>
                  <small>
                    Payment instructions will be shown after placing the order.
                  </small>
                </span>
              </label>
            </div>
          </section>
          <button className="button" type="submit" disabled={loadingShipping}>
            {loadingShipping ? "Updating total…" : "Place order"}
          </button>
        </>
      )}
      {shippingError && (
        <p className="checkout-error" role="alert">
          {shippingError}
        </p>
      )}
    </form>
  );
}

function NewAddressFields({
  address,
  defaultCountry,
  prefix = "",
}: {
  address: Address;
  defaultCountry: string;
  prefix?: string;
}) {
  const fieldName = (name: string) =>
    prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
  const fieldId = (name: string) => `${prefix || "shipping"}-${name}`;
  return (
    <div className="checkout-new-address-fields">
      <div className="checkout-two-columns">
        <div className="form-group">
          <label htmlFor={fieldId("firstName")}>First name</label>
          <input
            className="input"
            id={fieldId("firstName")}
            name={fieldName("firstName")}
            defaultValue={address.firstName}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor={fieldId("lastName")}>Last name</label>
          <input
            className="input"
            id={fieldId("lastName")}
            name={fieldName("lastName")}
            defaultValue={address.lastName}
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={fieldId("streetName")}>Street address</label>
        <input
          className="input"
          id={fieldId("streetName")}
          name={fieldName("streetName")}
          defaultValue={address.streetName}
          required
        />
      </div>
      <div className="checkout-two-columns">
        <div className="form-group">
          <label htmlFor={fieldId("city")}>City</label>
          <input
            className="input"
            id={fieldId("city")}
            name={fieldName("city")}
            defaultValue={address.city}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor={fieldId("postalCode")}>Postal code</label>
          <input
            className="input"
            id={fieldId("postalCode")}
            name={fieldName("postalCode")}
            defaultValue={address.postalCode}
            required
          />
        </div>
      </div>
      <div className="checkout-two-columns">
        <AddressCountryFields
          idPrefix={`${prefix || "shipping"}-address`}
          countryName={fieldName("country")}
          stateName={fieldName("state")}
          defaultCountry={address.country ?? defaultCountry}
          defaultState={address.state}
        />
      </div>
    </div>
  );
}
