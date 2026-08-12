import { apiRoot } from '@/lib/ct-client';
import { cookies } from 'next/headers';

function getCartCookie() {
  return cookies().get('commerce_cart_id')?.value;
}

export async function getCartFromRequest() {
  const cartId = getCartCookie();
  if (!cartId) {
    return null;
  }

  const result = await apiRoot.carts().withId({ ID: cartId }).get().execute();
  return result.body;
}

export async function createCart(lineItems: Array<any>) {
  const result = await apiRoot.carts().post({
    body: {
      currency: 'USD',
      lineItems,
    },
  }).execute();
  return result.body;
}
