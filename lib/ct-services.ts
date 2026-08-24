import { apiRoot } from '@/lib/ct-client';

export async function searchProducts({
  query,
  category,
  limit = 12,
  locale = 'en',
}: {
  query: string;
  category?: string;
  limit?: number;
  locale?: string;
}) {
  const normalizedQuery = query.trim();
  let categoryFilter: string | undefined;
  if (category) {
    categoryFilter = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(category)
      ? `categories.id:"${category}"`
      : `categories.key:"${category}"`;
  }

  const search = (queryArgs: Record<string, string | string[] | number | boolean | undefined>) =>
    apiRoot.productProjections().search().get({ queryArgs }).execute();
  const commonQuery = { limit, staged: false, filter: categoryFilter };

  // Primary request is a locale-scoped text search.
  let response = await search({
    ...commonQuery,
    ...(normalizedQuery ? { [`text.${locale}`]: normalizedQuery, markMatchingVariants: true } : {}),
  });
  if (response?.body?.results?.length > 0) return response.body;

  // fallback 1: try text search without locale
  if (normalizedQuery) {
    response = await search({ ...commonQuery, text: normalizedQuery, markMatchingVariants: true });
    if (response?.body?.results?.length > 0) return response.body;

    // fallback 2: try SKU exact match
    response = await search({
      ...commonQuery,
      filter: categoryFilter
        ? [`variants.sku:"${normalizedQuery}"`, categoryFilter]
        : `variants.sku:"${normalizedQuery}"`,
    });
    if (response?.body?.results?.length > 0) return response.body;
  }

  return response.body;
}

export async function fetchCategories({ limit = 50 }: { limit?: number } = {}) {
  const response = await apiRoot.categories().get({ queryArgs: { limit } }).execute();
  return response.body.results;
}

export async function getProductBySlug(slug: string) {
  let response = await apiRoot.productProjections().search().get({
    queryArgs: { filter: `slug.en-US:"${slug}"`, limit: 1, staged: false },
  }).execute();

  let product = response.body?.results?.[0] ?? null;

  if (!product) {
    // fallback to lookup by product ID if slug search returns no result
    response = await apiRoot.productProjections().search().get({
      queryArgs: { filter: `id:"${slug}"`, limit: 1, staged: false },
    }).execute();

    product = response.body?.results?.[0] ?? null;
  }

  return product;
}
