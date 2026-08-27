import { apiRoot } from "@/lib/ct-client";
import { cookies } from "next/headers";

export async function getCurrentCustomer() {
  const customerId = cookies().get("commerce_customer_id")?.value;
  if (!customerId) {
    return null;
  }

  try {
    return (
      await apiRoot.customers().withId({ ID: customerId }).get().execute()
    ).body;
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return null;
  }
}
