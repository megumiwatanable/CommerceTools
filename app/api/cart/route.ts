import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { resolveStorefrontContext } from "@/lib/storefront-context";
import { FlashCode, withFlash } from "@/lib/flash";

function cartRedirect(
  request: NextRequest,
  params: Record<string, string> = {},
  returnTo?: string,
) {
  const url = new URL(
    returnTo === "/checkout" ? "/checkout" : "/cart",
    request.url,
  );
  const code: FlashCode | undefined = params.cart_replaced
    ? "cart_context_replaced"
    : params.added
      ? "product_added"
      : params.updated
        ? "cart_updated"
        : params.removed
          ? "cart_removed"
          : params.cleared
            ? "cart_cleared"
    : params.discount
      ? "discount_applied"
      : params.reordered
        ? "reordered"
        : params.selected_added
          ? "selected_added"
          : params.error === "invalid_discount"
            ? "invalid_discount"
            : params.error === "select_items"
              ? "select_items"
              : params.error
                ? "generic_error"
                : undefined;
  const response = NextResponse.redirect(url);
  return code ? withFlash(response, code) : response;
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const body = (error as { body?: { errors?: Array<{ code?: string }> } }).body;
  return body?.errors?.[0]?.code;
}

async function getPriceSelectionForSku(
  sku: string,
  preferredCountry: string,
  storeKey: string,
) {
  const response = await apiRoot
    .productProjections()
    .search()
    .get({
      queryArgs: {
        filter: `variants.sku:"${sku.replace(/"/g, '\\"')}"`,
        limit: 1,
        staged: false,
        storeProjection: storeKey,
      },
    })
    .execute();
  const product = response.body.results[0];
  const variant = [product?.masterVariant, ...(product?.variants ?? [])].find(
    (item) => item?.sku === sku,
  );
  const prices = variant?.prices ?? [];
  // Price selection needs the same country context on the Cart. Prefer the
  // shopper's chosen country, then an unrestricted price, then any public price.
  const price =
    prices.find(
      (item) =>
        item.country === preferredCountry &&
        !item.customerGroup &&
        !item.channel,
    ) ??
    prices.find(
      (item) => !item.country && !item.customerGroup && !item.channel,
    ) ??
    prices.find((item) => !item.customerGroup && !item.channel);

  return price
    ? { currency: price.value.currencyCode, country: preferredCountry }
    : null;
}

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const action = body.get("action");
  const returnTo =
    body.get("returnTo") === "/checkout" ? "/checkout" : undefined;
  const cookieStore = request.cookies;
  const cartId = cookieStore.get("commerce_cart_id")?.value;
  const storefront = await resolveStorefrontContext(
    cookieStore.get("commerce_store_key")?.value,
    cookieStore.get("commerce_country")?.value,
  );

  if (action === "add-selected") {
    const skus = body.getAll("selection").flatMap((value) => {
      if (typeof value !== "string") return [];
      try {
        const parsed = JSON.parse(value);
        return typeof parsed.sku === "string" && parsed.sku ? [parsed.sku] : [];
      } catch {
        return [];
      }
    });
    if (!skus.length)
      return cartRedirect(request, { error: "select_items" });
    try {
      const priceSelection = await getPriceSelectionForSku(
        skus[0],
        storefront.country.code,
        storefront.store.key,
      );
      if (!priceSelection)
        return cartRedirect(request, { error: "price_not_found" });
      let currentCart = null;
      if (cartId) {
        try {
          currentCart = (
            await apiRoot.carts().withId({ ID: cartId }).get().execute()
          ).body;
        } catch {
          // A stale cart is replaced below.
        }
      }
      const activeCart = currentCart?.cartState === "Active" ? currentCart : null;
      const compatible = Boolean(
        activeCart &&
          activeCart.totalPrice.currencyCode === priceSelection.currency &&
          activeCart.store?.key === storefront.store.key &&
          activeCart.country === priceSelection.country,
      );
      const cart = compatible && activeCart
        ? (
            await apiRoot
              .inStoreKeyWithStoreKeyValue({ storeKey: storefront.store.key })
              .carts()
              .withId({ ID: activeCart.id })
              .post({
                body: {
                  version: activeCart.version,
                  actions: skus.map((sku) => ({ action: "addLineItem" as const, sku, quantity: 1 })),
                },
              })
              .execute()
          ).body
        : (
            await apiRoot
              .inStoreKeyWithStoreKeyValue({ storeKey: storefront.store.key })
              .carts()
              .post({
                body: {
                  ...priceSelection,
                  lineItems: skus.map((sku) => ({ sku, quantity: 1 })),
                },
              })
              .execute()
          ).body;
      const response = cartRedirect(request, { selected_added: "1" });
      response.cookies.set("commerce_cart_id", cart.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
      return response;
    } catch (error) {
      console.error("Failed to add selected wishlist items:", error);
      return cartRedirect(request, { error: "add_failed" });
    }
  }

  if (action === "add") {
    const sku = body.get("sku");
    const requestedQuantity = Number(body.get("quantity") || 1);
    if (typeof sku !== "string" || !sku)
      return cartRedirect(request, { error: "invalid_product" });
    const quantity =
      Number.isFinite(requestedQuantity) && requestedQuantity > 0
        ? Math.floor(requestedQuantity)
        : 1;

    try {
      // A Cart must have the same price-selection context as the chosen variant.
      // Resolve this server-side instead of trusting a client-side currency.
      const preferredCountry = storefront.country.code;
      const priceSelection = await getPriceSelectionForSku(
        sku,
        preferredCountry,
        storefront.store.key,
      );
      if (!priceSelection)
        return cartRedirect(request, { error: "price_not_found" });

      let currentCart = null;
      if (cartId) {
        try {
          currentCart = (
            await apiRoot.carts().withId({ ID: cartId }).get().execute()
          ).body;
        } catch {
          // An expired/deleted cart cookie is replaced below.
        }
      }

      // Ordered carts remain readable in commercetools but cannot be changed.
      // Treat one in a stale cookie exactly like no cart and start a fresh cart.
      const activeCart =
        currentCart?.cartState === "Active" ? currentCart : null;
      const replacesPriceContextMismatchedCart = Boolean(
        activeCart &&
          (activeCart.totalPrice.currencyCode !== priceSelection.currency ||
            activeCart.store?.key !== storefront.store.key ||
            (priceSelection.country &&
              activeCart.country !== priceSelection.country)),
      );
      const cart =
        activeCart && !replacesPriceContextMismatchedCart
          ? (
              await apiRoot
                .inStoreKeyWithStoreKeyValue({
                  storeKey: storefront.store.key,
                })
                .carts()
                .withId({ ID: activeCart.id })
                .post({
                  body: {
                    version: activeCart.version,
                    actions: [{ action: "addLineItem", sku, quantity }],
                  },
                })
                .execute()
            ).body
          : (
              await apiRoot
                .inStoreKeyWithStoreKeyValue({
                  storeKey: storefront.store.key,
                })
                .carts()
                .post({
                  body: { ...priceSelection, lineItems: [{ sku, quantity }] },
                })
                .execute()
            ).body;

      const response = cartRedirect(
        request,
        replacesPriceContextMismatchedCart
          ? { cart_replaced: "price_context_changed" }
          : { added: "1" },
      );
      response.cookies.set("commerce_cart_id", cart.id, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
      return response;
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      return cartRedirect(request, { error: "add_failed" });
    }
  }

  if (!cartId) {
    return cartRedirect(request);
  }

  const cartResponse = await apiRoot
    .carts()
    .withId({ ID: cartId })
    .get()
    .execute();
  const cart = cartResponse.body;
  if (
    cart.cartState !== "Active" ||
    cart.store?.key !== storefront.store.key ||
    cart.country !== storefront.country.code
  ) {
    const response = cartRedirect(request);
    response.cookies.delete("commerce_cart_id");
    return response;
  }

  if (action === "update") {
    const lineItemId = body.get("lineItemId");
    if (typeof lineItemId !== "string") return cartRedirect(request);
    const quantity = Number(body.get("quantity") || 1);
    await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        body: {
          version: cart.version,
          actions: [{ action: "changeLineItemQuantity", lineItemId, quantity }],
        },
      })
      .execute();
    return cartRedirect(request, { updated: "1" }, returnTo);
  }

  if (action === "remove") {
    const lineItemId = body.get("lineItemId");
    if (typeof lineItemId !== "string") return cartRedirect(request);
    await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        body: {
          version: cart.version,
          actions: [{ action: "removeLineItem", lineItemId }],
        },
      })
      .execute();
    return cartRedirect(request, { removed: "1" }, returnTo);
  }

  if (action === "update-all") {
    const removeLineItemId = body.get("removeLineItemId");
    if (typeof removeLineItemId === "string") {
      await apiRoot
        .carts()
        .withId({ ID: cartId })
        .post({
          body: {
            version: cart.version,
            actions: [
              { action: "removeLineItem", lineItemId: removeLineItemId },
            ],
          },
        })
        .execute();
      return cartRedirect(request, { removed: "1" }, returnTo);
    }
    const lineItemIds = body.getAll("lineItemId");
    const quantities = body.getAll("quantity");
    const actions = lineItemIds.flatMap((lineItemId, index) => {
      const quantity = Number(quantities[index]);
      return typeof lineItemId === "string" &&
        Number.isFinite(quantity) &&
        quantity > 0
        ? [
            {
              action: "changeLineItemQuantity" as const,
              lineItemId,
              quantity: Math.floor(quantity),
            },
          ]
        : [];
    });
    if (actions.length)
      await apiRoot
        .carts()
        .withId({ ID: cartId })
        .post({ body: { version: cart.version, actions } })
        .execute();
    return cartRedirect(request, { updated: "1" }, returnTo);
  }

  if (action === "clear") {
    await apiRoot
      .carts()
      .withId({ ID: cartId })
      .post({
        body: {
          version: cart.version,
          actions: cart.lineItems.map((item) => ({
            action: "removeLineItem" as const,
            lineItemId: item.id,
          })),
        },
      })
      .execute();
    return cartRedirect(request, { cleared: "1" }, returnTo);
  }

  if (action === "apply-discount") {
    const code = body.get("discountCode");
    if (typeof code !== "string" || !code.trim())
      return cartRedirect(request, { error: "invalid_discount" }, returnTo);
    const discountCode = code.trim();
    const alreadyApplied = cart.discountCodes?.some(
      (item: any) => item.discountCode?.obj?.code === discountCode,
    );
    if (alreadyApplied)
      return cartRedirect(request, { discount: "applied" }, returnTo);

    try {
      await apiRoot
        .carts()
        .withId({ ID: cartId })
        .post({
          body: {
            version: cart.version,
            actions: [{ action: "addDiscountCode", code: discountCode }],
          },
        })
        .execute();
      return cartRedirect(request, { discount: "applied" }, returnTo);
    } catch (error) {
      if (getErrorCode(error) === "DuplicateField") {
        return cartRedirect(request, { discount: "applied" }, returnTo);
      }
      console.error("Failed to apply discount code:", error);
      return cartRedirect(request, { error: "invalid_discount" }, returnTo);
    }
  }

  return cartRedirect(request);
}
