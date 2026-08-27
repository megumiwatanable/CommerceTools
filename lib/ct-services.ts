import { apiRoot } from "@/lib/ct-client";

export async function searchProducts({
  query,
  category,
  limit = 12,
  offset = 0,
  locale = "en",
  storeKey,
}: {
  query: string;
  category?: string | string[];
  limit?: number;
  offset?: number;
  locale?: string;
  storeKey?: string;
}): Promise<{ results: any[]; total?: number }> {
  const categoryIds = (
    Array.isArray(category) ? category : category ? [category] : []
  ).filter(Boolean);
  // Multiple sidebar selections use an OR relationship. Merge each category
  // result here because commercetools' repeated filter parameters are ANDed.
  if (categoryIds.length > 1) {
    const pages = await Promise.all(
      categoryIds.map((categoryId) =>
        searchProducts({
          query,
          category: categoryId,
          limit: 500,
          locale,
          storeKey,
        }),
      ),
    );
    const merged = Array.from(
      new Map(
        pages
          .flatMap((page) => page.results)
          .map((product: any) => [product.id, product]),
      ).values(),
    );
    return {
      results: merged.slice(offset, offset + limit),
      total: merged.length,
    };
  }
  const selectedCategory = categoryIds[0];
  const normalizedQuery = query.trim();
  let categoryFilter: string | undefined;
  if (selectedCategory) {
    categoryFilter =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        selectedCategory,
      )
        ? `categories.id:"${selectedCategory}"`
        : `categories.key:"${selectedCategory}"`;
  }

  const search = (
    queryArgs: Record<string, string | string[] | number | boolean | undefined>,
  ) => apiRoot.productProjections().search().get({ queryArgs }).execute();
  const commonQuery = {
    limit,
    offset,
    staged: false,
    filter: categoryFilter,
    storeProjection: storeKey,
  };

  // Text search is locale-specific in commercetools. Storefront product data
  // commonly uses `en-US`, while the UI language is often just `en`, so query
  // both forms instead of assuming one is present in every project.
  const locales = [
    ...new Set([locale, locale.split("-")[0], "en-US", "en-GB"]),
  ];
  let lastBody: any = { results: [] };

  if (!normalizedQuery) return (await search(commonQuery)).body;

  for (const searchLocale of locales) {
    try {
      const response = await search({
        ...commonQuery,
        [`text.${searchLocale}`]: normalizedQuery,
        fuzzy: true,
        markMatchingVariants: true,
      });
      lastBody = response.body;
      if (response.body.results.length > 0) return response.body;
    } catch (error) {
      // An unavailable locale must not make the entire product search fail.
      console.warn(
        `Product search unavailable for locale ${searchLocale}`,
        error,
      );
    }
  }

  try {
    const response = await search({
      ...commonQuery,
      filter: categoryFilter
        ? [`variants.sku:"${normalizedQuery}"`, categoryFilter]
        : `variants.sku:"${normalizedQuery}"`,
    });
    lastBody = response.body;
    if (response.body.results.length > 0) return response.body;
  } catch (error) {
    console.warn("SKU product search failed", error);
  }

  // Last-resort fallback: product projection text search can be disabled or
  // not indexed in a project. A bounded catalogue scan keeps name/SKU search
  // usable in that case and works with legacy product data too.
  try {
    const response = await apiRoot
      .productProjections()
      .get({ queryArgs: { limit: 500, staged: false, storeProjection: storeKey } })
      .execute();
    const needle = normalizedQuery.toLocaleLowerCase();
    const results = response.body.results.filter((product: any) => {
      const matchesText = [
        ...Object.values(product.name ?? {}),
        ...Object.values(product.slug ?? {}),
        ...Object.values(product.description ?? {}),
        product.masterVariant?.sku,
        ...(product.variants ?? []).map((variant: any) => variant.sku),
      ].some(
        (field) =>
          typeof field === "string" &&
          field.toLocaleLowerCase().includes(needle),
      );
      const matchesCategory =
        !selectedCategory ||
        (product.categories ?? []).some(
          (item: any) =>
            item.id === selectedCategory || item.obj?.key === selectedCategory,
        );
      return matchesText && matchesCategory;
    });
    return {
      ...response.body,
      results: results.slice(offset, offset + limit),
      total: results.length,
    };
  } catch (error) {
    console.error("Catalogue fallback search failed", error);
    return lastBody;
  }
}

export async function fetchCategories({ limit = 50 }: { limit?: number } = {}) {
  const response = await apiRoot
    .categories()
    .get({ queryArgs: { limit } })
    .execute();
  return response.body.results;
}

export async function fetchCustomerOrders({
  customerId,
  customerEmail,
  limit = 5,
  offset = 0,
}: {
  customerId: string;
  customerEmail: string;
  limit?: number;
  offset?: number;
}) {
  const safeCustomerId = customerId.replace(/"/g, '\\"');
  const safeCustomerEmail = customerEmail.replace(/"/g, '\\"');
  const response = await apiRoot
    .orders()
    .get({
      queryArgs: {
        where: `customerId="${safeCustomerId}" or (customerId is not defined and customerEmail="${safeCustomerEmail}")`,
        sort: "createdAt desc",
        limit,
        offset,
        withTotal: true,
      },
    })
    .execute();

  return response.body;
}

export async function getProductBySlug(slug: string, storeKey?: string) {
  let response = await apiRoot
    .productProjections()
    .search()
    .get({
      queryArgs: {
        filter: `slug.en-US:"${slug}"`,
        limit: 1,
        staged: false,
        storeProjection: storeKey,
      },
    })
    .execute();

  let product = response.body?.results?.[0] ?? null;

  if (!product) {
    // fallback to lookup by product ID if slug search returns no result
    response = await apiRoot
      .productProjections()
      .search()
      .get({
        queryArgs: {
          filter: `id:"${slug}"`,
          limit: 1,
          staged: false,
          storeProjection: storeKey,
        },
      })
      .execute();

    product = response.body?.results?.[0] ?? null;
  }

  return product;
}

export async function fetchProductProjectionsByIds(
  productIds: string[],
  storeKey?: string,
) {
  const ids = [...new Set(productIds)].filter(Boolean);
  if (!ids.length) return [];
  const quotedIds = ids.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(",");
  const response = await apiRoot.productProjections().get({
    queryArgs: {
      where: `id in (${quotedIds})`,
      limit: Math.min(ids.length, 500),
      staged: false,
      storeProjection: storeKey,
    },
  }).execute();
  return response.body.results;
}
