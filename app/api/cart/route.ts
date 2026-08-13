import { NextRequest, NextResponse } from 'next/server';
import { apiRoot, executeRequest } from '@/lib/ct-client';

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const action = body.get('action');
  const cookieStore = request.cookies;
  const cartId = cookieStore.get('commerce_cart_id')?.value;

  if (action === 'add') {
    const sku = body.get('sku');
    const quantity = Number(body.get('quantity') || 1);
    if (!sku) return NextResponse.redirect('/products');

    let cart;
    if (cartId) {
      const currentCartResponse = await executeRequest({
        method: 'GET',
        uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
      });
      const currentCart = currentCartResponse.body;
      const cartResponse = await executeRequest({
        method: 'POST',
        uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
        body: {
          version: currentCart.version,
          actions: [{ action: 'addLineItem', sku, quantity }],
        },
      });
      cart = cartResponse.body;
    } else {
      // create an empty cart first, then add line item via update action
      const createResp = await executeRequest({
        method: 'POST',
        uri: apiRoot.carts.build(),
        body: {
          currency: 'USD',
        },
      });
      const createdCart = createResp.body;

      const cartResponse = await executeRequest({
        method: 'POST',
        uri: apiRoot.carts.parse({ id: String(createdCart.id) }).build(),
        body: {
          version: createdCart.version,
          actions: [{ action: 'addLineItem', sku: String(sku), quantity }],
        },
      });
      cart = cartResponse.body;
    }

    const response = NextResponse.redirect('/cart');
    response.cookies.set('commerce_cart_id', cart.id, { path: '/' });
    return response;
  }

  if (!cartId) {
    return NextResponse.redirect('/cart');
  }

  const cartResponse = await executeRequest({
    method: 'GET',
    uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
  });
  const cart = cartResponse.body;

  if (action === 'update') {
    const lineItemId = body.get('lineItemId');
    const quantity = Number(body.get('quantity') || 1);
    const result = await executeRequest({
      method: 'POST',
      uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
      body: {
        version: cart.version,
        actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
      },
    });
    return NextResponse.redirect('/cart');
  }

  if (action === 'remove') {
    const lineItemId = body.get('lineItemId');
    await executeRequest({
      method: 'POST',
      uri: apiRoot.carts.parse({ id: String(cartId) }).build(),
      body: {
        version: cart.version,
        actions: [{ action: 'removeLineItem', lineItemId }],
      },
    });
    return NextResponse.redirect('/cart');
  }

  return NextResponse.redirect('/cart');
}
