import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { withFlash } from "@/lib/flash";

function result(request: NextRequest, token: string, success: boolean) {
  const url = new URL("/account/reset-password", request.url);
  if (!success && token) url.searchParams.set("token", token);
  return withFlash(
    NextResponse.redirect(success ? new URL("/account", request.url) : url),
    success ? "password_updated" : "reset_invalid",
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmPassword") ?? "");
  if (!token || password.length < 8 || password !== confirmation)
    return result(request, token, false);

  try {
    const customer = (
      await apiRoot.customers().withPasswordToken({ passwordToken: token }).get().execute()
    ).body;
    await apiRoot.customers().passwordReset().post({
      body: { version: customer.version, tokenValue: token, newPassword: password },
    }).execute();
    return result(request, token, true);
  } catch {
    return result(request, token, false);
  }
}
