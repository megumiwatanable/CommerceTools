"use client";

import { useEffect, useRef } from "react";
import ProductRating from "@/components/product-rating";
import type { ProductReviews } from "@/lib/ct-reviews";

export default function ProductReviewModal({
  productId,
  productName,
  returnTo,
  reviews,
  signedIn,
}: {
  productId: string;
  productName: string;
  returnTo: string;
  reviews: ProductReviews;
  signedIn: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (window.location.hash === "#reviews") dialogRef.current?.showModal();
  }, []);

  return (
    <div className="product-review-entry">
      <button className="review-summary-button" type="button" onClick={() => dialogRef.current?.showModal()}>
        <ProductRating summary={reviews} />
        <span>Read &amp; write reviews</span>
      </button>

      <dialog ref={dialogRef} className="review-dialog" onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}>
        <div className="review-dialog-content">
          <div className="review-dialog-header">
            <div>
              <p className="eyebrow">Customer reviews</p>
              <h2>{productName}</h2>
              <ProductRating summary={reviews} />
            </div>
            <button className="review-close" type="button" aria-label="Close reviews" onClick={() => dialogRef.current?.close()}>×</button>
          </div>

          <div className="review-dialog-grid">
            <section className="review-list" aria-label="Product reviews">
              {reviews.reviews.length ? reviews.reviews.map((review) => (
                <article className="review-item" key={review.id}>
                  <ProductRating summary={{ average: review.rating, count: 1 }} compact />
                  <h3>{review.title}</h3>
                  <p>{review.comment}</p>
                  <footer>
                    <strong>{review.authorName}</strong>
                    <span>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(review.updatedAt))}</span>
                  </footer>
                </article>
              )) : <p className="empty-copy">No reviews yet. Be the first to share your experience.</p>}
            </section>

            <section className="review-form-panel">
              <h3>Write a review</h3>
              <form method="post" action="/api/reviews" className="review-form">
                  <input type="hidden" name="productId" value={productId} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  {!signedIn && (
                    <>
                      <label htmlFor="review-author">Your name</label>
                      <input id="review-author" name="authorName" className="input" maxLength={80} autoComplete="name" required />
                    </>
                  )}
                  <label htmlFor="review-rating">Rating</label>
                  <select id="review-rating" name="rating" className="select" defaultValue="5" required>
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Good</option>
                    <option value="3">3 — Average</option>
                    <option value="2">2 — Fair</option>
                    <option value="1">1 — Poor</option>
                  </select>
                  <label htmlFor="review-title">Title</label>
                  <input id="review-title" name="title" className="input" maxLength={80} required />
                  <label htmlFor="review-comment">Review</label>
                  <textarea id="review-comment" name="comment" className="textarea" minLength={10} maxLength={1000} rows={6} required />
                  <button className="button" type="submit">Submit review</button>
                  <p className="review-form-note">Each submission is added as a new review.</p>
                </form>
            </section>
          </div>
        </div>
      </dialog>
    </div>
  );
}
