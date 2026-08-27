import { NextRequest, NextResponse } from "next/server";
import { resolveStorefrontContext } from "@/lib/storefront-context";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const storeKey = typeof body.storeKey === "string" ? body.storeKey : "";
  const country = typeof body.country === "string" ? body.country : "";
  const context = await resolveStorefrontContext(storeKey, country);
  if (context.store.key !== storeKey || context.country.code !== country)
    return NextResponse.json(
      { message: "Invalid storefront selection." },
      { status: 400 },
    );

  const response = NextResponse.json({ ok: true });
  const options = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 365,
  };
  response.cookies.set("commerce_store_key", context.store.key, options);
  response.cookies.set("commerce_country", context.country.code, options);
  response.cookies.delete("commerce_cart_id");
  return response;
}
