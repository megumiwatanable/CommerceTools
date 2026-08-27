import { apiRoot } from "@/lib/ct-client";
import { cookies } from "next/headers";

function getCartCookie() {
  return cookies().get("commerce_cart_id")?.value;
}

export async function getCartFromRequest() {
  const cartId = getCartCookie();
  if (!cartId) return null;

  try {
    const result = await apiRoot.carts().withId({ ID: cartId }).get().execute();
    return result.body.cartState === "Active" ? result.body : null;
  } catch (error) {
    console.error("Failed to fetch active cart:", error);
    return null;
  }
}

export async function createCart(
  lineItems: Array<{
    sku?: string;
    SKU?: string;
    productSku?: string;
    quantity?: number;
    qty?: number;
  }>,
  currency: string,
) {
  let cart = (await apiRoot.carts().post({ body: { currency } }).execute())
    .body;

  for (const lineItem of lineItems ?? []) {
    const sku = lineItem.sku ?? lineItem.SKU ?? lineItem.productSku;
    if (!sku) continue;
    const quantity = lineItem.quantity ?? lineItem.qty ?? 1;
    cart = (
      await apiRoot
        .carts()
        .withId({ ID: cart.id })
        .post({
          body: {
            version: cart.version,
            actions: [{ action: "addLineItem", sku, quantity }],
          },
        })
        .execute()
    ).body;
  }

  return cart;
}
