import { apiRoot } from "@/lib/ct-client";

export async function getAuthorizedCustomerOrder(
  orderId: string,
  customer: any,
) {
  try {
    const order = (
      await apiRoot.orders().withId({ ID: orderId }).get().execute()
    ).body;
    const ownsCustomerOrder = order.customerId === customer.id;
    const ownsGuestOrder =
      !order.customerId &&
      order.customerEmail?.toLocaleLowerCase() ===
        customer.email.toLocaleLowerCase();
    return ownsCustomerOrder || ownsGuestOrder ? order : null;
  } catch {
    return null;
  }
}

export function canCustomerCancelOrder(order: any) {
  return (
    order.orderState === "Open" &&
    order.shipmentState !== "Shipped" &&
    order.shipmentState !== "Delivered"
  );
}

export function canCustomerRequestReturn(order: any) {
  return (
    order.orderState !== "Cancelled" &&
    (order.shipmentState === "Shipped" || order.shipmentState === "Delivered")
  );
}
