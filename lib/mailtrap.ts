import { formatMoney } from "@/lib/money";
import nodemailer from "nodemailer";

type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getPublicAppUrl(requestUrl?: string) {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}

export async function sendMail(mail: Mail) {
  const host = process.env.MAIL_HOST?.trim();
  const port = Number(process.env.MAIL_PORT ?? 2525);
  const user = process.env.MAIL_USERNAME?.trim();
  const pass = process.env.MAIL_PASSWORD?.trim();
  if (!host || !Number.isInteger(port) || !user || !pass) {
    console.warn("Mailtrap email skipped because its environment is incomplete.");
    return { sent: false as const, reason: "not_configured" as const };
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transport.sendMail({
    from:
      process.env.MAIL_FROM?.trim() ||
      '"Marketly" <from@example.com>',
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  return { sent: true as const };
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  requestUrl: string,
) {
  const resetUrl = `${getPublicAppUrl(requestUrl)}/account/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: email,
    subject: "Reset your Marketly password",
    text: `Use this link within 60 minutes to reset your password: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<h1>Reset your password</h1><p>Use the link below within 60 minutes to choose a new password.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

export async function sendOrderConfirmationEmail(order: any, payment: string) {
  const reference = order.orderNumber ?? `#${String(order.id).slice(-8).toUpperCase()}`;
  const items = (order.lineItems ?? [])
    .map((item: any) => {
      const name = item.name?.["en-US"] ?? Object.values(item.name ?? {})[0] ?? "Product";
      return `${name} × ${item.quantity} — ${formatMoney(item.totalPrice)}`;
    })
    .join("\n");
  const itemRows = (order.lineItems ?? [])
    .map((item: any) => {
      const name = item.name?.["en-US"] ?? Object.values(item.name ?? {})[0] ?? "Product";
      return `<tr><td>${escapeHtml(name)} × ${item.quantity}</td><td>${escapeHtml(formatMoney(item.totalPrice))}</td></tr>`;
    })
    .join("");
  const paymentLabel = payment === "bank-transfer" ? "Bank transfer" : "Cash on delivery";

  return sendMail({
    to: order.customerEmail,
    subject: `Order ${reference} confirmed`,
    text: `Thank you for your order ${reference}.\n\n${items}\n\nTotal: ${formatMoney(order.totalPrice)}\nPayment: ${paymentLabel}`,
    html: `<h1>Order confirmed</h1><p>Thank you for your order <strong>${escapeHtml(reference)}</strong>.</p><table>${itemRows}</table><p><strong>Total: ${escapeHtml(formatMoney(order.totalPrice))}</strong></p><p>Payment: ${escapeHtml(paymentLabel)}</p>`,
  });
}

export async function sendReturnRequestEmail(
  order: any,
  customerEmail: string,
  reason: string,
) {
  const reference = order.orderNumber ?? `#${String(order.id).slice(-8).toUpperCase()}`;
  return sendMail({
    to: process.env.MAIL_SUPPORT_TO?.trim() || customerEmail,
    subject: `Return request for order ${reference}`,
    text: `Customer: ${customerEmail}\nOrder: ${reference}\nReason: ${reason}`,
    html: `<h1>Return request</h1><p><strong>Customer:</strong> ${escapeHtml(customerEmail)}</p><p><strong>Order:</strong> ${escapeHtml(reference)}</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p>`,
  });
}
