import { NextRequest, NextResponse } from "next/server";
import { apiRoot } from "@/lib/ct-client";
import { sendPasswordResetEmail } from "@/lib/mailtrap";
import { withFlash } from "@/lib/flash";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = form.get("email");
  if (typeof email === "string" && email.trim()) {
    try {
      const token = (
        await apiRoot.customers().passwordToken().post({
          body: {
            email: email.trim(),
            ttlMinutes: 60,
            invalidateOlderTokens: true,
          },
        }).execute()
      ).body;
      await sendPasswordResetEmail(email.trim(), token.value, request.url);
    } catch (error) {
      console.warn("Password reset request could not be completed.", error);
    }
  }
  return withFlash(
    NextResponse.redirect(new URL("/account/forgot-password", request.url)),
    "reset_sent",
  );
}
