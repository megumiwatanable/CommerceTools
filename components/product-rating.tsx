import type { ReviewSummary } from "@/lib/ct-reviews";

export default function ProductRating({
  summary,
  compact = false,
}: {
  summary: ReviewSummary;
  compact?: boolean;
}) {
  const rounded = Math.round(summary.average);
  const label = summary.count
    ? `${summary.average.toFixed(1)} out of 5 from ${summary.count} review${summary.count === 1 ? "" : "s"}`
    : "No reviews yet";

  return (
    <span className={`product-rating${compact ? " product-rating-compact" : ""}`} aria-label={label}>
      <span className="rating-stars" aria-hidden>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rounded ? "filled" : undefined}>★</span>
        ))}
      </span>
      <span className="rating-copy">
        {summary.count ? `${summary.average.toFixed(1)} (${summary.count})` : "No reviews"}
      </span>
    </span>
  );
}
