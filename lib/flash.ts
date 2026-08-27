import { NextResponse } from "next/server";

export type FlashCode = keyof typeof FLASH_MESSAGES;

const FLASH_MESSAGES = {
  generic_error: { type: "error", message: "Something went wrong. Please try again." },
  auth_error: { type: "error", message: "We couldn’t sign you in or create your account." },
  wishlist_login: { type: "error", message: "Sign in to save products to your wishlist." },
  wishlist_added: { type: "success", message: "Product saved to your wishlist." },
  wishlist_removed: { type: "success", message: "Selected products were removed from your wishlist." },
  wishlist_error: { type: "error", message: "Your wishlist could not be updated." },
  select_items: { type: "error", message: "Select at least one product first." },
  cart_updated: { type: "success", message: "Your cart was updated." },
  product_added: { type: "success", message: "Product added to your cart." },
  cart_removed: { type: "success", message: "Product removed from your cart." },
  cart_cleared: { type: "success", message: "Your cart was cleared." },
  cart_context_replaced: { type: "error", message: "A new cart was started for the selected country or currency." },
  discount_applied: { type: "success", message: "Discount code applied." },
  invalid_discount: { type: "error", message: "That discount code is invalid or no longer available." },
  reordered: { type: "success", message: "Order items were added to a new cart using current prices." },
  selected_added: { type: "success", message: "Selected wishlist products were added to your cart." },
  account_saved: { type: "success", message: "Your account changes were saved." },
  address_saved: { type: "success", message: "Your address book was updated." },
  order_cancelled: { type: "success", message: "The order was cancelled." },
  return_requested: { type: "success", message: "Your return request was sent to customer support." },
  reset_sent: { type: "success", message: "If the account exists, a reset link has been sent." },
  password_updated: { type: "success", message: "Your password was updated. You can now sign in." },
  reset_invalid: { type: "error", message: "This reset link is invalid or expired." },
  checkout_error: { type: "error", message: "Please review your checkout details and try again." },
} as const;

export function withFlash(response: NextResponse, code: FlashCode) {
  response.cookies.set("commerce_flash", code, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60,
  });
  return response;
}

export function getFlashMessage(value?: string) {
  if (!value || !(value in FLASH_MESSAGES)) return null;
  return FLASH_MESSAGES[value as FlashCode];
}
