import Link from "next/link";

export default function CatalogPagination({
  basePath,
  page,
  total,
  limit,
  query,
  categories,
}: {
  basePath: string;
  page: number;
  total?: number;
  limit: number;
  query?: string;
  categories?: string | string[];
}) {
  const pages = Math.max(1, Math.ceil((total ?? 0) / limit));
  if (pages <= 1) return null;
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    (Array.isArray(categories) ? categories : categories ? [categories] : [])
      .filter(Boolean)
      .forEach((category) => params.append("category", category));
    params.set("page", String(nextPage));
    return `${basePath}?${params}`;
  };
  return (
    <nav className="catalog-pagination" aria-label="Pagination">
      {page > 1 && <Link href={href(page - 1)}>← Previous</Link>}
      {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
        <Link
          key={number}
          className={number === page ? "active" : ""}
          href={href(number)}
        >
          {number}
        </Link>
      ))}
      {page < pages && <Link href={href(page + 1)}>Next →</Link>}
    </nav>
  );
}
