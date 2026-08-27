import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/ct-session";
import {
  canCustomerRequestReturn,
  getAuthorizedCustomerOrder,
} from "@/lib/ct-orders";
import { sendReturnRequestEmail } from "@/lib/mailtrap";
import { withFlash } from "@/lib/flash";

function redirect(request: NextRequest, orderId: string, success = false) {
  const url = new URL(`/account/orders/${orderId}`, request.url);
  return withFlash(
    NextResponse.redirect(url),
    success ? "return_requested" : "generic_error",
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const customer = await getAuthenticatedCustomer(request);
  if (!customer) return redirect(request, params.id);
  const order = await getAuthorizedCustomerOrder(params.id, customer);
  if (!order || !canCustomerRequestReturn(order))
    return redirect(request, params.id);
  const form = await request.formData();
  const reason = String(form.get("reason") ?? "").trim();
  if (reason.length < 10) return redirect(request, params.id);
  try {
    await sendReturnRequestEmail(order, customer.email, reason);
    return redirect(request, params.id, true);
  } catch (error) {
    console.error("Failed to send return request email:", error);
    return redirect(request, params.id);
  }
}
