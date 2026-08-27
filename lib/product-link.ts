export function getProductHref(product: any): string {
  const slug =
    product?.productSlug?.["en-US"] ||
    product?.productSlug?.["en-GB"] ||
    Object.values(product?.productSlug ?? {})[0] ||
    product?.slug?.["en-US"] ||
    product?.slug?.["en-GB"] ||
    Object.values(product?.slug ?? {})[0] ||
    product?.productId ||
    product?.id;

  return `/product/${encodeURIComponent(String(slug))}`;
}
