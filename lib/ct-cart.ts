import { apiRoot, executeRequest } from '@/lib/ct-client';
import { cookies } from 'next/headers';

function getCartCookie() {
  return cookies().get('commerce_cart_id')?.value;
}

export async function getCartFromRequest() {
  const cartId = getCartCookie();
  if (!cartId) {
    return null;
  }

  const result = await executeRequest({
    method: 'GET',
    uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
  });
  return result.body;
}

export async function createCart(lineItems: Array<any>) {
  // create empty cart
  const createResp = await executeRequest({
    method: 'POST',
    uri: apiRoot.carts.build(),
    body: {
      currency: 'USD',
    },
  });
  let cart = createResp.body;

  // if line items provided, add them via update actions
  if (lineItems && lineItems.length > 0) {
    for (const li of lineItems) {
      const sku = li.sku || li.SKU || li.productSku;
      const quantity = li.quantity || li.qty || 1;
      const resp = await executeRequest({
        method: 'POST',
        uri: apiRoot.carts.parse({ id: String(cart.id) }).build(),
        body: {
          version: cart.version,
          actions: [{ action: 'addLineItem', sku: String(sku), quantity }],
        },
      });
      cart = resp.body;
    }
  }

  return cart;
}
