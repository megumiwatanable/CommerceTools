import { apiRoot } from "@/lib/ct-client";

const REVIEW_CONTAINER = "product-reviews";

export type ProductReview = {
  id: string;
  customerId?: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewValue = {
  productId: string;
  reviews: ProductReview[];
};

export type ReviewSummary = {
  average: number;
  count: number;
};

export type ProductReviews = ReviewSummary & {
  reviews: ProductReview[];
};

const emptyReviews = (): ProductReviews => ({ reviews: [], average: 0, count: 0 });

function normalizeReviews(value: unknown): ProductReview[] {
  if (!value || typeof value !== "object") return [];
  const reviews = (value as { reviews?: unknown }).reviews;
  if (!Array.isArray(reviews)) return [];
  return reviews.filter((review): review is ProductReview => {
    if (!review || typeof review !== "object") return false;
    const item = review as Partial<ProductReview>;
    return (
      typeof item.id === "string" &&
      (item.customerId === undefined || typeof item.customerId === "string") &&
      typeof item.authorName === "string" &&
      Number.isInteger(item.rating) &&
      Number(item.rating) >= 1 &&
      Number(item.rating) <= 5 &&
      typeof item.title === "string" &&
      typeof item.comment === "string" &&
      typeof item.createdAt === "string" &&
      typeof item.updatedAt === "string"
    );
  });
}

function summarize(value: unknown): ProductReviews {
  const reviews = normalizeReviews(value).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const count = reviews.length;
  const average = count
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / count
    : 0;
  return { reviews, count, average };
}

function isNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 404
  );
}

function isConcurrentModification(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const body = (error as { body?: { errors?: Array<{ code?: string }> } }).body;
  return Boolean(
    body?.errors?.some((item) => item.code === "ConcurrentModification"),
  );
}

async function getReviewObject(productId: string) {
  try {
    return (
      await apiRoot
        .customObjects()
        .withContainerAndKey({ container: REVIEW_CONTAINER, key: productId })
        .get()
        .execute()
    ).body;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function getProductReviews(productId: string) {
  const object = await getReviewObject(productId);
  return object ? summarize(object.value) : emptyReviews();
}

export async function getReviewSummaries(productIds: string[]) {
  const ids = [...new Set(productIds)].filter(Boolean);
  const summaries = new Map<string, ReviewSummary>();
  ids.forEach((id) => summaries.set(id, { average: 0, count: 0 }));
  if (!ids.length) return summaries;

  const quoted = ids.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(",");
  const response = await apiRoot
    .customObjects()
    .withContainer({ container: REVIEW_CONTAINER })
    .get({
      queryArgs: {
        where: `key in (${quoted})`,
        limit: Math.min(ids.length, 500),
      },
    })
    .execute();

  response.body.results.forEach((object) => {
    const { average, count } = summarize(object.value);
    summaries.set(object.key, { average, count });
  });
  return summaries;
}

export async function addProductReview({
  productId,
  customerId,
  authorName,
  rating,
  title,
  comment,
}: {
  productId: string;
  customerId?: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await getReviewObject(productId);
    const reviews = normalizeReviews(current?.value);
    const now = new Date().toISOString();
    const review: ProductReview = {
      id: crypto.randomUUID(),
      ...(customerId ? { customerId } : {}),
      authorName,
      rating,
      title,
      comment,
      createdAt: now,
      updatedAt: now,
    };
    const value: ReviewValue = {
      productId,
      reviews: [review, ...reviews],
    };

    try {
      return (
        await apiRoot.customObjects().post({
          body: {
            container: REVIEW_CONTAINER,
            key: productId,
            value,
            ...(current ? { version: current.version } : {}),
          },
        }).execute()
      ).body;
    } catch (error) {
      if (!isConcurrentModification(error) || attempt === 2) throw error;
    }
  }
  throw new Error("Unable to save product review");
}
