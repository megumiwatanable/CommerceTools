"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

type Money = { centAmount: number; currencyCode: string };

function money(centAmount: number, currencyCode: string): Money {
  return { centAmount, currencyCode };
}

export default function OrderTotals({ cart }: { cart: any }) {
  const [currentCart, setCurrentCart] = useState(cart);

  useEffect(() => {
    const updateTotals = (event: Event) =>
      setCurrentCart((event as CustomEvent).detail);
    window.addEventListener("checkout-cart-updated", updateTotals);
    return () =>
      window.removeEventListener("checkout-cart-updated", updateTotals);
  }, []);

  const currency =
    currentCart.totalPrice?.currencyCode ??
    currentCart.lineItems?.[0]?.price?.value?.currencyCode ??
    "USD";
  const subtotal = (currentCart.lineItems ?? []).reduce(
    (sum: number, item: any) =>
      sum + (item.price?.value?.centAmount ?? 0) * item.quantity,
    0,
  );
  const hasShipping = Boolean(currentCart.shippingInfo?.price);
  const shipping = currentCart.shippingInfo?.price?.centAmount ?? 0;
  const shippingAfterDiscount =
    currentCart.shippingInfo?.discountedPrice?.value?.centAmount ?? shipping;
  const lineItemsTotal = (currentCart.lineItems ?? []).reduce(
    (sum: number, item: any) => {
      const discountedQuantities = item.discountedPricePerQuantity ?? [];
      if (discountedQuantities.length > 0) {
        return (
          sum +
          discountedQuantities.reduce(
            (lineSum: number, entry: any) =>
              lineSum +
              (entry.discountedPrice?.value?.centAmount ?? 0) * entry.quantity,
            0,
          )
        );
      }
      return sum + (item.totalPrice?.centAmount ?? 0);
    },
    0,
  );
  const totalPriceDiscount =
    currentCart.discountOnTotalPrice?.discountedAmount?.centAmount ?? 0;
  const grandTotal =
    currentCart.totalPrice?.centAmount ?? subtotal + shippingAfterDiscount;
  const discount = Math.max(
    0,
    subtotal -
      lineItemsTotal +
      shipping -
      shippingAfterDiscount +
      totalPriceDiscount,
  );
  const taxedPrice = currentCart.taxedPrice;
  const totalNet = taxedPrice?.totalNet?.centAmount;
  const totalGross = taxedPrice?.totalGross?.centAmount;
  const taxAmount =
    typeof totalNet === "number" && typeof totalGross === "number"
      ? Math.max(0, totalGross - totalNet)
      : undefined;
  const taxIncluded = [
    ...(currentCart.lineItems ?? []).map(
      (item: any) => item.taxRate?.includedInPrice,
    ),
    currentCart.shippingInfo?.taxRate?.includedInPrice,
  ].some(Boolean);
  const taxPortions = taxedPrice?.taxPortions ?? [];

  return (
    <div className="order-totals">
      <div>
        <span>Subtotal</span>
        <strong>{formatMoney(money(subtotal, currency))}</strong>
      </div>
      {discount > 0 && (
        <div className="discount-row">
          <span>Discount</span>
          <strong>−{formatMoney(money(discount, currency))}</strong>
        </div>
      )}
      <div>
        <span>Shipping</span>
        <strong>
          {hasShipping
            ? formatMoney(money(shippingAfterDiscount, currency))
            : "Calculated at checkout"}
        </strong>
      </div>
      {taxPortions.length > 0 ? (
        taxPortions.map((portion: any, index: number) => (
          <div
            className="tax-row"
            key={`${portion.name ?? "tax"}-${portion.rate}-${index}`}
          >
            <span>
              Tax
              {portion.name ? ` · ${portion.name}` : ""}
              {typeof portion.rate === "number"
                ? ` (${formatTaxRate(portion.rate)})`
                : ""}
            </span>
            <strong>{formatMoney(portion.amount)}</strong>
          </div>
        ))
      ) : (
        <div className="tax-row">
          Tax
          <strong>
            {typeof taxAmount === "number"
              ? formatMoney(money(taxAmount, currency))
              : "Calculated after address"}
          </strong>
        </div>
      )}
      <div className="order-grand-total">
        <span>Grand total</span>
        <strong>{formatMoney(money(grandTotal, currency))}</strong>
      </div>
    </div>
  );
}

function formatTaxRate(rate: number) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(rate);
}
