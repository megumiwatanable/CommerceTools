import { apiRoot } from "@/lib/ct-client";

const wishlistKey = (customerId: string) => `wishlist-${customerId}`;

export async function getCustomerWishlist(customerId: string) {
  const response = await apiRoot.shoppingLists().get({
    queryArgs: {
      where: `key="${wishlistKey(customerId)}" and customer(id="${customerId}")`,
      limit: 1,
    },
  }).execute();
  return response.body.results[0] ?? null;
}

async function getOrCreateCustomerWishlist(customerId: string) {
  const existing = await getCustomerWishlist(customerId);
  if (existing) return existing;
  try {
    return (
      await apiRoot.shoppingLists().post({
        body: {
          key: wishlistKey(customerId),
          name: { en: "Wishlist" },
          customer: { typeId: "customer", id: customerId },
        },
      }).execute()
    ).body;
  } catch (error) {
    // A concurrent first add may have created the same keyed list.
    const created = await getCustomerWishlist(customerId);
    if (created) return created;
    throw error;
  }
}

function matchingLineItem(list: any, productId: string, variantId: number) {
  return (list.lineItems ?? []).find(
    (item: any) =>
      item.productId === productId && item.variantId === variantId,
  );
}

function isConcurrentModification(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const body = (error as { body?: { errors?: Array<{ code?: string }> } }).body;
  return body?.errors?.some((item) => item.code === "ConcurrentModification") ?? false;
}

export async function setWishlistItem({
  customerId,
  productId,
  variantId,
  desired,
}: {
  customerId: string;
  productId: string;
  variantId: number;
  desired: "present" | "absent";
}) {
  let list = await getOrCreateCustomerWishlist(customerId);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const lineItem = matchingLineItem(list, productId, variantId);
    if ((desired === "present" && lineItem) || (desired === "absent" && !lineItem))
      return list;

    const action =
      desired === "present"
        ? { action: "addLineItem" as const, productId, variantId, quantity: 1 }
        : { action: "removeLineItem" as const, lineItemId: lineItem.id };
    try {
      return (
        await apiRoot.shoppingLists().withId({ ID: list.id }).post({
          body: { version: list.version, actions: [action] },
        }).execute()
      ).body;
    } catch (error) {
      if (!isConcurrentModification(error) || attempt === 1) throw error;
      const refreshed = await getCustomerWishlist(customerId);
      if (!refreshed) throw error;
      list = refreshed;
    }
  }
  return list;
}

export async function removeWishlistItems(
  customerId: string,
  items: Array<{ productId: string; variantId: number }>,
) {
  let list = await getCustomerWishlist(customerId);
  if (!list) return null;
  const selected = new Set(items.map((item) => `${item.productId}:${item.variantId}`));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actions = (list.lineItems ?? []).flatMap((item: any) =>
      selected.has(`${item.productId}:${item.variantId}`)
        ? [{ action: "removeLineItem" as const, lineItemId: item.id }]
        : [],
    );
    if (!actions.length) return list;
    try {
      return (
        await apiRoot.shoppingLists().withId({ ID: list.id }).post({
          body: { version: list.version, actions },
        }).execute()
      ).body;
    } catch (error) {
      if (!isConcurrentModification(error) || attempt === 1) throw error;
      const refreshed = await getCustomerWishlist(customerId);
      if (!refreshed) throw error;
      list = refreshed;
    }
  }
  return list;
}
