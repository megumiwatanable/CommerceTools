import { apiRoot, executeRequest, productProjectionService } from '@/lib/ct-client';

export async function searchProducts({
  query,
  category,
  limit = 12,
}: {
  query: string;
  category?: string;
  limit?: number;
}) {
  const normalizedQuery = query.trim();
  let requestBuilder = apiRoot.productProjectionsSearch
    .perPage(limit)
    .staged(false);

  if (normalizedQuery) {
    requestBuilder = requestBuilder.text(normalizedQuery, 'en').markMatchingVariants();
  }

  if (category) {
    const categoryFilter = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(category)
      ? `categories.id:"${category}"`
      : `categories.key:"${category}"`;
    requestBuilder = requestBuilder.filter(categoryFilter);
  }

  const response = await executeRequest({
    method: 'GET',
    uri: requestBuilder.build(),
  });

  return response.body;
}

export async function getProductBySlug(slug: string) {
  let requestBuilder = apiRoot.productProjectionsSearch
    .filter(`slug.en-US:\"${slug}\"`)
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
      .filter(`id:\"${slug}\"`)
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
