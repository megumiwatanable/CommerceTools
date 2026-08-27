import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomerId } from "@/lib/ct-session";
import { removeWishlistItems, setWishlistItem } from "@/lib/ct-wishlist";
import { FlashCode, withFlash } from "@/lib/flash";

function parseSelection(value: FormDataEntryValue) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    const variantId = Number(parsed.variantId);
    return typeof parsed.productId === "string" && parsed.productId &&
      Number.isInteger(variantId) && variantId > 0
      ? { productId: parsed.productId, variantId }
      : null;
  } catch {
    return null;
  }
}

function destination(request: NextRequest, raw: FormDataEntryValue | null) {
  const fallback = "/account/wishlist";
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//"))
    return new URL(fallback, request.url);
  const url = new URL(raw, request.url);
  if (url.origin !== new URL(request.url).origin) return new URL(fallback, request.url);
  return url;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const returnUrl = destination(request, form.get("returnTo"));
  const customerId = await getAuthenticatedCustomerId(request);
  if (!customerId) {
    const account = new URL("/account", request.url);
    return withFlash(NextResponse.redirect(account), "wishlist_login");
  }
  const respond = (code: FlashCode) =>
    withFlash(NextResponse.redirect(returnUrl), code);

  const productId = form.get("productId");
  const variantId = Number(form.get("variantId"));
  const action = form.get("action");
  if (action === "remove-selected") {
    const items = form.getAll("selection").flatMap((value) => {
      const parsed = parseSelection(value);
      return parsed ? [parsed] : [];
    });
    if (!items.length) {
      return respond("select_items");
    }
    try {
      await removeWishlistItems(customerId, items);
      return respond("wishlist_removed");
    } catch (error) {
      console.error("Failed to remove selected wishlist items:", error);
      return respond("wishlist_error");
    }
  }
  if (
    typeof productId !== "string" ||
    !productId ||
    !Number.isInteger(variantId) ||
    variantId < 1 ||
    (action !== "add" && action !== "remove")
  ) {
    return respond("wishlist_error");
  }

  try {
    await setWishlistItem({
      customerId,
      productId,
      variantId,
      desired: action === "add" ? "present" : "absent",
    });
    return respond(action === "add" ? "wishlist_added" : "wishlist_removed");
  } catch (error) {
    console.error("Failed to update wishlist:", error);
    return respond("wishlist_error");
  }
}
