import { apiRoot, executeRequest } from '@/lib/ct-client';

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
  let requestBuilder = apiRoot.productProjectionsSearch
    .perPage(limit)
    .staged(false);

  if (normalizedQuery) {
    // try text search scoped to locale first
    requestBuilder = requestBuilder.text(normalizedQuery, locale).markMatchingVariants();
  }

  let categoryFilter: string | null = null;
  if (category) {
    categoryFilter = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(category)
      ? `categories.id:"${category}"`
      : `categories.key:"${category}"`;
    requestBuilder = requestBuilder.filter(categoryFilter);
  }

  // primary try: locale-scoped text search
  let response = await executeRequest({ method: 'GET', uri: requestBuilder.build() });
  if (response?.body?.results?.length > 0) return response.body;

  // fallback 1: try text search without locale
  if (normalizedQuery) {
    const fallbackBuilder = apiRoot.productProjectionsSearch.perPage(limit).staged(false).text(normalizedQuery, locale).markMatchingVariants();
    if (categoryFilter) fallbackBuilder.filter(categoryFilter);
    response = await executeRequest({ method: 'GET', uri: fallbackBuilder.build() });
    if (response?.body?.results?.length > 0) return response.body;

    // fallback 2: try SKU exact match
    const skuFilterBuilder = apiRoot.productProjectionsSearch.perPage(limit).staged(false).filter(`variants.sku:"${normalizedQuery}"`);
    response = await executeRequest({ method: 'GET', uri: skuFilterBuilder.build() });
    if (response?.body?.results?.length > 0) return response.body;
  }

  return response.body;
}

export async function fetchCategories({ limit = 50 }: { limit?: number } = {}) {
  const uri = apiRoot.categories.build();
  const response = await executeRequest({ method: 'GET', uri });
  return response.body?.results || response.body;
}

export async function getProductBySlug(slug: string) {
  let requestBuilder = apiRoot.productProjectionsSearch
    .filter(`slug.${'en-US'}:"${slug}"`)
    .perPage(1)
    .staged(false);

  let response = await executeRequest({
    method: 'GET',
    uri: requestBuilder.build(),
  });

  let product = response.body?.results?.[0] ?? null;

  if (!product) {
    // fallback to lookup by product ID if slug search returns no result
    requestBuilder = apiRoot.productProjectionsSearch
      .filter(`id:"${slug}"`)
      .perPage(1)
      .staged(false);

    response = await executeRequest({
      method: 'GET',
      uri: requestBuilder.build(),
    });

    product = response.body?.results?.[0] ?? null;
  }

  return product;
}
