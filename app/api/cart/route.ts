import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct-client';

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
      const currentCartResponse = await apiRoot.carts().withId({ ID: cartId }).get().execute();
      const currentCart = currentCartResponse.body;
      const cartResponse = await apiRoot.carts().withId({ ID: cartId }).post({
        body: {
          version: currentCart.version,
          actions: [{ action: 'addLineItem', sku, quantity }],
        },
      }).execute();
      cart = cartResponse.body;
    } else {
      const cartResponse = await apiRoot.carts().post({
        body: {
          currency: 'USD',
          lineItems: [{ sku, quantity }],
        },
      }).execute();
      cart = cartResponse.body;
    }

    const response = NextResponse.redirect('/cart');
    response.cookies.set('commerce_cart_id', cart.id, { path: '/' });
    return response;
  }

  if (!cartId) {
    return NextResponse.redirect('/cart');
  }

  const cartResponse = await apiRoot.carts().withId({ ID: cartId }).get().execute();
  const cart = cartResponse.body;

  if (action === 'update') {
    const lineItemId = body.get('lineItemId');
    const quantity = Number(body.get('quantity') || 1);
    const result = await apiRoot.carts().withId({ ID: cartId }).post({
      body: {
        version: cart.version,
        actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
      },
    }).execute();
    return NextResponse.redirect('/cart');
  }

  if (action === 'remove') {
    const lineItemId = body.get('lineItemId');
    await apiRoot.carts().withId({ ID: cartId }).post({
      body: {
        version: cart.version,
        actions: [{ action: 'removeLineItem', lineItemId }],
      },
    }).execute();
    return NextResponse.redirect('/cart');
  }

  return NextResponse.redirect('/cart');
}
