import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { withFlash } from "@/lib/flash";

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const email = body.get("email");
  const password = body.get("password");
  const firstName = body.get("firstName");
  const lastName = body.get("lastName");

  const accountUrl = new URL("/account", request.url);
  if (!email || !password || !firstName || !lastName) {
    return withFlash(NextResponse.redirect(accountUrl), "auth_error");
  }

  try {
    const customer = (
      await apiRoot
        .customers()
        .post({
          body: {
            email: email.toString(),
            password: password.toString(),
            firstName: firstName.toString(),
            lastName: lastName.toString(),
          },
        })
        .execute()
    ).body;

    const response = NextResponse.redirect(new URL("/account", request.url));
    response.cookies.set("commerce_customer_id", customer.customer.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return withFlash(NextResponse.redirect(accountUrl), "auth_error");
  }
}
