import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct-client';

function checkoutRedirect(request: NextRequest, error?: string) {
  const url = new URL('/checkout', request.url);
  if (error) url.searchParams.set('error', error);
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const cartId = body.get('cartId');
  const email = body.get('email');
  const firstName = body.get('firstName');
  const lastName = body.get('lastName');
  const streetName = body.get('streetName');
  const city = body.get('city');
  const postalCode = body.get('postalCode');
  const country = body.get('country');
  const shippingMethodId = body.get('shippingMethodId');
  const paymentMethod = body.get('paymentMethod');

  const requiredFields = [cartId, email, firstName, lastName, streetName, city, postalCode, country, shippingMethodId, paymentMethod];
  if (!requiredFields.every((value) => typeof value === 'string' && value.trim())) {
    return checkoutRedirect(request, 'complete_checkout');
  }

  try {
    const cart = (await apiRoot.carts().withId({ ID: cartId }).get().execute()).body;
    const cartWithAddress = (await apiRoot.carts().withId({ ID: cart.id }).post({
      body: {
        version: cart.version,
        actions: [
          { action: 'setCustomerEmail', email },
          { action: 'setShippingAddress', address: { firstName, lastName, streetName, city, postalCode, country } },
        ],
      },
    }).execute()).body;

    const matchingMethods = await apiRoot.shippingMethods().matchingCart().get({
      queryArgs: { cartId: cartWithAddress.id },
    }).execute();
    if (!matchingMethods.body.results.some((method) => method.id === shippingMethodId)) {
      return checkoutRedirect(request, 'invalid_shipping_method');
    }

    const cartWithShipping = (await apiRoot.carts().withId({ ID: cartWithAddress.id }).post({
      body: {
        version: cartWithAddress.version,
        actions: [{
          action: 'setShippingMethod',
          shippingMethod: { typeId: 'shipping-method', id: shippingMethodId },
        }],
      },
    }).execute()).body;

    // Payment choice is validated above. Actual authorization/capture must be
    // handled by a PSP integration before this order is placed.
    await apiRoot.orders().post({
      body: {
        cart: { typeId: 'cart', id: cartWithShipping.id },
        version: cartWithShipping.version,
      },
    }).execute();

    const confirmationUrl = new URL('/order-confirmation', request.url);
    confirmationUrl.searchParams.set('payment', paymentMethod);
    return NextResponse.redirect(confirmationUrl);
  } catch (error) {
    console.error('Failed to place order:', error);
    return checkoutRedirect(request, 'order_failed');
  }
}
