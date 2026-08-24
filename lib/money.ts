type Money = { centAmount: number; currencyCode: string };
type Price = { value: Money; country?: string; customerGroup?: unknown; channel?: unknown; discounted?: { value: Money } };

const localeForCurrency: Record<string, string> = {
  EUR: 'de-DE',
  GBP: 'en-GB',
  USD: 'en-US',
};

export function formatMoney(money?: Money) {
  if (!money) return '—';

  return new Intl.NumberFormat(localeForCurrency[money.currencyCode] ?? 'en-US', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(money.centAmount / 100);
}

export function selectPublicPrice(prices: Price[] | undefined, country: string) {
  return prices?.find((price) => price.country === country && !price.customerGroup && !price.channel)
    ?? prices?.find((price) => !price.country && !price.customerGroup && !price.channel)
    ?? prices?.find((price) => !price.customerGroup && !price.channel);
}
