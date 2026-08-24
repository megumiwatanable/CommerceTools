import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct-client';

function cartRedirect(request: NextRequest, params: Record<string, string> = {}) {
  const url = new URL('/cart', request.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

async function getPriceSelectionForSku(sku: string, preferredCountry: string) {
  const response = await apiRoot.productProjections().search().get({
    queryArgs: { filter: `variants.sku:"${sku.replace(/"/g, '\\"')}"`, limit: 1, staged: false },
  }).execute();
  const product = response.body.results[0];
  const variant = [product?.masterVariant, ...(product?.variants ?? [])].find((item) => item?.sku === sku);
  const prices = variant?.prices ?? [];
  // Price selection needs the same country context on the Cart. Prefer the
  // shopper's chosen country, then an unrestricted price, then any public price.
  const price =
    prices.find((item) => item.country === preferredCountry && !item.customerGroup && !item.channel) ??
    prices.find((item) => !item.country && !item.customerGroup && !item.channel) ??
    prices.find((item) => !item.customerGroup && !item.channel);

  return price ? { currency: price.value.currencyCode, country: price.country } : null;
}

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const action = body.get('action');
  const cookieStore = request.cookies;
  const cartId = cookieStore.get('commerce_cart_id')?.value;

  if (action === 'add') {
    const sku = body.get('sku');
    const requestedQuantity = Number(body.get('quantity') || 1);
    if (typeof sku !== 'string' || !sku) return cartRedirect(request, { error: 'invalid_product' });
    const quantity = Number.isFinite(requestedQuantity) && requestedQuantity > 0 ? Math.floor(requestedQuantity) : 1;

    try {
      // A Cart must have the same price-selection context as the chosen variant.
      // Resolve this server-side instead of trusting a client-side currency.
      const preferredCountry = cookieStore.get('commerce_country')?.value ?? 'US';
      const priceSelection = await getPriceSelectionForSku(sku, preferredCountry);
      if (!priceSelection) return cartRedirect(request, { error: 'price_not_found' });

      let currentCart = null;
      if (cartId) {
        try {
          currentCart = (await apiRoot.carts().withId({ ID: cartId }).get().execute()).body;
        } catch {
          // An expired/deleted cart cookie is replaced below.
        }
      }

      const replacesPriceContextMismatchedCart = Boolean(
        currentCart && (
          currentCart.totalPrice.currencyCode !== priceSelection.currency ||
          (priceSelection.country && currentCart.country !== priceSelection.country)
        ),
      );
      const cart = currentCart && !replacesPriceContextMismatchedCart
        ? (await apiRoot.carts().withId({ ID: currentCart.id }).post({
            body: {
              version: currentCart.version,
              actions: [{ action: 'addLineItem', sku, quantity }],
            },
          }).execute()).body
        : (await apiRoot.carts().post({
            body: { ...priceSelection, lineItems: [{ sku, quantity }] },
          }).execute()).body;

      const response = cartRedirect(request, replacesPriceContextMismatchedCart ? { cart_replaced: 'price_context_changed' } : {});
      response.cookies.set('commerce_cart_id', cart.id, { path: '/', httpOnly: true, sameSite: 'lax' });
      return response;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      return cartRedirect(request, { error: 'add_failed' });
    }
  }

  if (!cartId) {
    return cartRedirect(request);
  }

  const cartResponse = await apiRoot.carts().withId({ ID: cartId }).get().execute();
  const cart = cartResponse.body;

  if (action === 'update') {
    const lineItemId = body.get('lineItemId');
    if (typeof lineItemId !== 'string') return cartRedirect(request);
    const quantity = Number(body.get('quantity') || 1);
    await apiRoot.carts().withId({ ID: cartId }).post({
      body: {
        version: cart.version,
        actions: [{ action: 'changeLineItemQuantity', lineItemId, quantity }],
      },
    }).execute();
    return cartRedirect(request);
  }

  if (action === 'remove') {
    const lineItemId = body.get('lineItemId');
    if (typeof lineItemId !== 'string') return cartRedirect(request);
    await apiRoot.carts().withId({ ID: cartId }).post({
      body: {
        version: cart.version,
        actions: [{ action: 'removeLineItem', lineItemId }],
      },
    }).execute();
    return cartRedirect(request);
  }

  return cartRedirect(request);
}
