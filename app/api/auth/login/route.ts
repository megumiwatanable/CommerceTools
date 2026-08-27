// /app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { withFlash } from "@/lib/flash";

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const email = body.get("email");
    const password = body.get("password");

    if (!email || !password) {
      return withFlash(NextResponse.redirect(new URL("/account", request.url)), "auth_error");
    }

    const response = await apiRoot
      .login()
      .post({
        body: {
          email: email.toString(),
          password: password.toString(),
        },
      })
      .execute();

    const customerId = response.body?.customer?.id;

    if (!customerId) {
      return withFlash(NextResponse.redirect(new URL("/account", request.url)), "auth_error");
    }

    const redirectUrl = new URL("/account", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.set("commerce_customer_id", customerId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return redirectResponse;
  } catch (error) {
    console.error("Login error:", error);
    return withFlash(NextResponse.redirect(new URL("/account", request.url)), "auth_error");
  }
}
