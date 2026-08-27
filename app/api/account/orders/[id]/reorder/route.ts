import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { getAuthenticatedCustomer } from "@/lib/ct-session";
import { getAuthorizedCustomerOrder } from "@/lib/ct-orders";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { withFlash } from "@/lib/flash";

function redirect(request: NextRequest, orderId: string, error?: string) {
  const url = new URL(
    error ? `/account/orders/${orderId}` : "/cart",
    request.url,
  );
  return withFlash(
    NextResponse.redirect(url),
    error ? "generic_error" : "reordered",
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer) return redirect(request, params.id, "session_required");
  const order = await getAuthorizedCustomerOrder(params.id, customer);
  if (!order) return redirect(request, params.id, "order_not_found");
  const lineItems = (order.lineItems ?? []).flatMap((item: any) =>
    item.variant?.sku
      ? [{ sku: item.variant.sku, quantity: item.quantity }]
      : [],
  );
  if (!lineItems.length)
    return redirect(request, params.id, "products_unavailable");

  try {
    const storefront = await resolveStorefrontContext(
      request.cookies.get("commerce_store_key")?.value,
      request.cookies.get("commerce_country")?.value,
    );
    const cart = (
      await apiRoot
        .inStoreKeyWithStoreKeyValue({ storeKey: storefront.store.key })
        .carts()
        .post({
          body: {
            currency: order.totalPrice.currencyCode,
            country: storefront.country.code,
            customerId: customer.id,
            customerEmail: customer.email,
            lineItems,
          },
        })
        .execute()
    ).body;
    const response = redirect(request, params.id);
    response.cookies.set("commerce_cart_id", cart.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return response;
  } catch (error) {
    console.error("Failed to reorder customer order:", error);
    return redirect(request, params.id, "reorder_failed");
  }
}
