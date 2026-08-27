import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { formatMoney } from "@/lib/money";
import { getAuthenticatedCustomer } from "@/lib/ct-session";
import { createCheckoutAddress } from "@/lib/checkout-address";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { isAddressCountryValid } from "@/lib/country-data";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    cartId,
    email,
    firstName,
    lastName,
    streetName,
    city,
    postalCode,
    country,
    state,
    shippingMethodId,
    billingAddressMode,
    billingFirstName,
    billingLastName,
    billingStreetName,
    billingCity,
    billingPostalCode,
    billingCountry,
    billingState,
  } = body;

  if (
    ![
      cartId,
      email,
      firstName,
      lastName,
      streetName,
      city,
      postalCode,
      country,
    ].every((value) => typeof value === "string" && value.trim())
  ) {
    return NextResponse.json(
      { message: "Please complete your contact and shipping address." },
      { status: 400 },
    );
  }

  try {
    const storefront = await resolveStorefrontContext(
      request.cookies.get("commerce_store_key")?.value,
      request.cookies.get("commerce_country")?.value,
    );
    const shippingAddress = createCheckoutAddress({
      firstName,
      lastName,
      streetName,
      city,
      postalCode,
      country,
      state,
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
    if (!shippingAddress || !billingAddress) {
      return NextResponse.json(
        { message: "Please complete your shipping and billing addresses." },
        { status: 400 },
      );
    }
    if (
      !isAddressCountryValid(shippingAddress) ||
      !isAddressCountryValid(billingAddress)
    ) {
      return NextResponse.json(
        {
          message: "Please select a valid country and state / province.",
        },
        { status: 400 },
      );
    }
    const customer = await getAuthenticatedCustomer(request);
    const customerId = customer?.id;
    const checkoutEmail = customer?.email ?? email;
    const cart = (await apiRoot.carts().withId({ ID: cartId }).get().execute())
      .body;
    if (
      cart.store?.key !== storefront.store.key ||
      cart.country !== storefront.country.code
    ) {
      return NextResponse.json(
        {
          message:
            "The cart belongs to a different storefront country. Please start a new cart.",
        },
        { status: 409 },
      );
    }
    if (cart.customerId && cart.customerId !== customerId) {
      return NextResponse.json(
        { message: "Please sign in again to use this cart." },
        { status: 403 },
      );
    }
    const updatedCart = (
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

    const shippingMethods = await apiRoot
      .shippingMethods()
      .matchingCart()
      .get({
        queryArgs: { cartId: updatedCart.id },
      })
      .execute();
    const methods = shippingMethods.body.results.map((method) => {
      const rate = method.zoneRates
        .flatMap((zoneRate) => zoneRate.shippingRates)
        .find((shippingRate) => shippingRate.isMatching);
      return {
        id: method.id,
        name: method.name,
        description: method.description,
        price: rate ? formatMoney(rate.price) : "Unavailable",
      };
    });

    const selectedMethodId =
      typeof shippingMethodId === "string" &&
      methods.some((method) => method.id === shippingMethodId)
        ? shippingMethodId
        : methods[0]?.id;
    if (!selectedMethodId)
      return NextResponse.json({ methods, cart: updatedCart });

    const cartWithShipping = (
      await apiRoot
        .carts()
        .withId({ ID: updatedCart.id })
        .post({
          body: {
            version: updatedCart.version,
            actions: [
              {
                action: "setShippingMethod",
                shippingMethod: {
                  typeId: "shipping-method",
                  id: selectedMethodId,
                },
              },
            ],
          },
        })
        .execute()
    ).body;

    return NextResponse.json({
      methods,
      selectedMethodId,
      cart: cartWithShipping,
    });
  } catch (error) {
    console.error("Failed to load shipping methods:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 409
    ) {
      return NextResponse.json(
        {
          message:
            "Your cart changed while shipping was being updated. Please try again.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Unable to load shipping methods." },
      { status: 500 },
    );
  }
}
