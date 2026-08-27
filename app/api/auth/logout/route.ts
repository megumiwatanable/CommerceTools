import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const accountUrl = new URL("/account", request.url);
  const response = NextResponse.redirect(accountUrl);
  response.cookies.delete("commerce_customer_id");
  response.cookies.delete("commerce_cart_id");
  return response;
}
