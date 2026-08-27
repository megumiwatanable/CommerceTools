import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { getAuthenticatedCustomer } from "@/lib/ct-session";
import {
  canCustomerCancelOrder,
  getAuthorizedCustomerOrder,
} from "@/lib/ct-orders";
import { withFlash } from "@/lib/flash";

function redirect(request: NextRequest, orderId: string, success = false) {
  const url = new URL(
    success ? "/account/orders" : `/account/orders/${orderId}`,
    request.url,
  );
  return withFlash(
    NextResponse.redirect(url),
    success ? "order_cancelled" : "generic_error",
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer) return redirect(request, params.id);
  const order = await getAuthorizedCustomerOrder(params.id, customer);
  if (!order || !canCustomerCancelOrder(order))
    return redirect(request, params.id);

  try {
    await apiRoot
      .orders()
      .withId({ ID: order.id })
      .post({
        body: {
          version: order.version,
          actions: [{ action: "changeOrderState", orderState: "Cancelled" }],
        },
      })
      .execute();
    return redirect(request, params.id, true);
  } catch (error) {
    console.error("Failed to cancel customer order:", error);
    return redirect(request, params.id);
  }
}
