import { createHmac, timingSafeEqual } from "crypto";

function signature(orderId: string) {
  const secret = process.env.CT_CLIENT_SECRET;
  if (!secret) throw new Error("Missing order confirmation signing secret");
  return createHmac("sha256", secret).update(orderId).digest("base64url");
}

export function createOrderConfirmationToken(orderId: string) {
  return `${orderId}.${signature(orderId)}`;
}

export function readOrderConfirmationToken(value?: string) {
  if (!value) return undefined;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return undefined;
  const orderId = value.slice(0, separator);
  const provided = Buffer.from(value.slice(separator + 1));
  const expected = Buffer.from(signature(orderId));
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected))
    return undefined;
  return orderId;
}
