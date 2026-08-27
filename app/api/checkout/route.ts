import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { getAuthenticatedCustomer } from "@/lib/ct-session";
import { createCheckoutAddress } from "@/lib/checkout-address";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { isAddressCountryValid } from "@/lib/country-data";
import { sendOrderConfirmationEmail } from "@/lib/mailtrap";
import { createOrderConfirmationToken } from "@/lib/order-confirmation-token";
import { withFlash } from "@/lib/flash";

function checkoutRedirect(request: NextRequest, error?: string) {
  const url = new URL("/checkout", request.url);
  const response = NextResponse.redirect(url);
  return error ? withFlash(response, "checkout_error") : response;
}

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const cartId = body.get("cartId");
  const email = body.get("email");
  const firstName = body.get("firstName");
  const lastName = body.get("lastName");
  const streetName = body.get("streetName");
  const city = body.get("city");
  const postalCode = body.get("postalCode");
  const country = body.get("country");
  const state = body.get("state");
  const shippingMethodId = body.get("shippingMethodId");
  const paymentMethod = body.get("paymentMethod");
  const billingAddressMode = body.get("billingAddressMode");
  const billingFirstName = body.get("billingFirstName");
  const billingLastName = body.get("billingLastName");
  const billingStreetName = body.get("billingStreetName");
  const billingCity = body.get("billingCity");
  const billingPostalCode = body.get("billingPostalCode");
  const billingCountry = body.get("billingCountry");
  const billingState = body.get("billingState");

  const requiredFields = [
    cartId,
    email,
    firstName,
    lastName,
    streetName,
    city,
    postalCode,
    country,
    shippingMethodId,
    paymentMethod,
  ];
  if (
    !requiredFields.every((value) => typeof value === "string" && value.trim())
  ) {
    return checkoutRedirect(request, "complete_checkout");
  }
  const [
    validCartId,
    validEmail,
    validFirstName,
    validLastName,
    validStreetName,
    validCity,
    validPostalCode,
    validCountry,
    validShippingMethodId,
    validPaymentMethod,
  ] = requiredFields as string[];
  if (!["cash-on-delivery", "bank-transfer"].includes(validPaymentMethod))
    return checkoutRedirect(request, "complete_checkout");
  const validState = typeof state === "string" ? state.trim() : "";

  try {
    const storefront = await resolveStorefrontContext(
      request.cookies.get("commerce_store_key")?.value,
      request.cookies.get("commerce_country")?.value,
    );
    const shippingAddress = createCheckoutAddress({
      firstName: validFirstName,
      lastName: validLastName,
      streetName: validStreetName,
      city: validCity,
      postalCode: validPostalCode,
      country: validCountry,
      state: validState,
    });
    const billingAddress =
      billingAddressMode === "same"
        ? shippingAddress
        : createCheckoutAddress({
            firstName: billingFirstName,
            lastName: billingLastName,
            streetName: billingStreetName,
            city: billingCity,
            postalCode: billingPostalCode,
            country: billingCountry,
            state: billingState,
          });
    if (!shippingAddress || !billingAddress)
      return checkoutRedirect(request, "complete_billing_address");
    if (
      !isAddressCountryValid(shippingAddress) ||
      !isAddressCountryValid(billingAddress)
    )
      return checkoutRedirect(request, "invalid_storefront_address");
    const customer = await getAuthenticatedCustomer(request);
    const customerId = customer?.id;
    const checkoutEmail = customer?.email ?? validEmail;
    const cart = (
      await apiRoot.carts().withId({ ID: validCartId }).get().execute()
    ).body;
    if (
      cart.store?.key !== storefront.store.key ||
      cart.country !== storefront.country.code
    )
      return checkoutRedirect(request, "invalid_storefront_country");
    if (cart.customerId && cart.customerId !== customerId) {
      return checkoutRedirect(request, "customer_session_required");
    }
    const cartWithAddress = (
      await apiRoot
        .carts()
        .withId({ ID: cart.id })
        .post({
          body: {
            version: cart.version,
            actions: [
              ...(customerId && cart.customerId !== customerId
                ? [{ action: "setCustomerId" as const, customerId }]
                : []),
              { action: "setCustomerEmail", email: checkoutEmail },
              {
                action: "setShippingAddress",
                address: shippingAddress,
              },
              { action: "setBillingAddress", address: billingAddress },
            ],
          },
        })
        .execute()
    ).body;

    const matchingMethods = await apiRoot
      .shippingMethods()
      .matchingCart()
      .get({
        queryArgs: { cartId: cartWithAddress.id },
      })
      .execute();
    if (
      !matchingMethods.body.results.some(
        (method) => method.id === validShippingMethodId,
      )
    ) {
      return checkoutRedirect(request, "invalid_shipping_method");
    }

    const cartWithShipping = (
      await apiRoot
        .carts()
        .withId({ ID: cartWithAddress.id })
        .post({
          body: {
            version: cartWithAddress.version,
            actions: [
              {
                action: "setShippingMethod",
                shippingMethod: {
                  typeId: "shipping-method",
                  id: validShippingMethodId,
                },
              },
            ],
          },
        })
        .execute()
    ).body;

    // Payment choice is validated above. Actual authorization/capture must be
    // handled by a PSP integration before this order is placed.
    const order = (
      await apiRoot
        .orders()
        .post({
          body: {
            cart: { typeId: "cart", id: cartWithShipping.id },
            version: cartWithShipping.version,
          },
        })
        .execute()
    ).body;

    try {
      await sendOrderConfirmationEmail(order, validPaymentMethod);
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
    }

    const confirmationUrl = new URL("/order-confirmation", request.url);
    confirmationUrl.searchParams.set("payment", validPaymentMethod);
    const response = NextResponse.redirect(confirmationUrl);
    response.cookies.set(
      "commerce_confirmation_order_id",
      createOrderConfirmationToken(order.id),
      {
      path: "/order-confirmation",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      },
    );
    // The cart has become Ordered and must never be reused for future adds.
    response.cookies.delete("commerce_cart_id");
    return response;
  } catch (error) {
    console.error("Failed to place order:", error);
    return checkoutRedirect(request, "order_failed");
  }
}
