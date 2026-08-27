import { NextRequest } from "next/server";
import { apiRoot } from "@/lib/ct-client";

export async function getAuthenticatedCustomer(request: NextRequest) {
  const customerId = request.cookies.get("commerce_customer_id")?.value;
  if (!customerId) return undefined;

  try {
    return (
      await apiRoot.customers().withId({ ID: customerId }).get().execute()
    ).body;
  } catch (error) {
    console.warn("Ignoring an invalid customer session while checking out.");
    return undefined;
  }
}

export async function getAuthenticatedCustomerId(
  request: NextRequest,
): Promise<string | undefined> {
  return (await getAuthenticatedCustomer(request))?.id;
}
