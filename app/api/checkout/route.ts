import { NextRequest, NextResponse } from 'next/server';
import { apiRoot, executeRequest } from '@/lib/ct-client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const cartId = body.get('cartId');
  const firstName = body.get('firstName');
  const lastName = body.get('lastName');
  const email = body.get('email');
  const streetName = body.get('streetName');
  const city = body.get('city');
  const postalCode = body.get('postalCode');
  const country = body.get('country');

  if (!cartId || !email || !firstName || !lastName || !streetName || !city || !postalCode || !country) {
    return NextResponse.redirect('/checkout');
  }

  const cart = await executeRequest({
    method: 'GET',
    uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
  }).then((res) => res.body);
  const updateActions: Array<any> = [
    {
      action: 'setCustomerEmail',
      email,
    },
    {
      action: 'setShippingAddress',
      address: {
        firstName,
        lastName,
        streetName,
        city,
        postalCode,
        country,
      },
    },
  ];

  const updatedCart = await executeRequest({
    method: 'POST',
    uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
    body: {
      version: cart.version,
      actions: updateActions,
    },
  }).then((res) => res.body);

  await executeRequest({
    method: 'POST',
    uri: apiRoot.orders.build(),
    body: {
      idempotencyKey: uuidv4(),
      cart: {
        id: updatedCart.id,
        version: updatedCart.version,
      },
    },
  });

  return NextResponse.redirect('/order-confirmation');
}
