import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { getAuthenticatedCustomer } from "@/lib/ct-session";
import { addProductReview } from "@/lib/ct-reviews";
import { withFlash } from "@/lib/flash";

function destination(request: NextRequest, raw: FormDataEntryValue | null) {
  const fallback = new URL("/products", request.url);
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  const url = new URL(raw, request.url);
  if (url.origin !== new URL(request.url).origin) return fallback;
  url.hash = "reviews";
  return url;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const returnUrl = destination(request, form.get("returnTo"));
  const customer = await getAuthenticatedCustomer(request);

  const productId = String(form.get("productId") ?? "").trim();
  const guestName = String(form.get("authorName") ?? "").trim();
  const authorName = customer
    ? [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
      "Verified customer"
    : guestName;
  const rating = Number(form.get("rating"));
  const title = String(form.get("title") ?? "").trim();
  const comment = String(form.get("comment") ?? "").trim();
  if (
    !productId ||
    !authorName ||
    authorName.length > 80 ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !title ||
    title.length > 80 ||
    comment.length < 10 ||
    comment.length > 1000
  ) {
    return withFlash(NextResponse.redirect(returnUrl), "review_error");
  }

  try {
    await apiRoot.productProjections().withId({ ID: productId }).get({ queryArgs: { staged: false } }).execute();
    await addProductReview({
      productId,
      customerId: customer?.id,
      authorName,
      rating,
      title,
      comment,
    });
    return withFlash(NextResponse.redirect(returnUrl), "review_saved");
  } catch (error) {
    console.error(`Failed to save product review productId=${productId}`, error);
    return withFlash(NextResponse.redirect(returnUrl), "review_error");
  }
}
