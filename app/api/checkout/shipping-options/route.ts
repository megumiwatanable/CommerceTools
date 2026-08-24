import { NextRequest, NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct-client';
import { formatMoney } from '@/lib/money';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cartId, email, firstName, lastName, streetName, city, postalCode, country } = body;

  if (![cartId, email, firstName, lastName, streetName, city, postalCode, country].every((value) => typeof value === 'string' && value.trim())) {
    return NextResponse.json({ message: 'Please complete your contact and shipping address.' }, { status: 400 });
  }

  try {
    const cart = (await apiRoot.carts().withId({ ID: cartId }).get().execute()).body;
    const updatedCart = (await apiRoot.carts().withId({ ID: cart.id }).post({
      body: {
        version: cart.version,
        actions: [
          { action: 'setCustomerEmail', email },
          { action: 'setShippingAddress', address: { firstName, lastName, streetName, city, postalCode, country } },
        ],
      },
    }).execute()).body;

    const shippingMethods = await apiRoot.shippingMethods().matchingCart().get({
      queryArgs: { cartId: updatedCart.id },
    }).execute();
    const methods = shippingMethods.body.results.map((method) => {
      const rate = method.zoneRates.flatMap((zoneRate) => zoneRate.shippingRates).find((shippingRate) => shippingRate.isMatching);
      return {
        id: method.id,
        name: method.name,
        description: method.description,
        price: rate ? formatMoney(rate.price) : 'Calculated at checkout',
      };
    });

    return NextResponse.json({ methods });
  } catch (error) {
    console.error('Failed to load shipping methods:', error);
    return NextResponse.json({ message: 'Unable to load shipping methods.' }, { status: 500 });
  }
}
