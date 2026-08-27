"use client";

import { useState } from "react";

export default function ProductGallery({
  images,
  alt,
}: {
  images: Array<{ url: string; label?: string }>;
  alt: string;
}) {
  const [active, setActive] = useState(0);
  if (!images.length)
    return (
      <div className="product-gallery-empty">No product image available</div>
    );
  const current = images[active] ?? images[0];
  return (
    <div className="product-gallery">
      <div className="product-gallery-thumbnails">
        {images.map((image, index) => (
          <button
            type="button"
            key={image.url}
            className={index === active ? "active" : ""}
            onClick={() => setActive(index)}
            aria-label={`View image ${index + 1}`}
          >
            <img src={image.url} alt="" />
          </button>
        ))}
      </div>
      <div className="product-gallery-main">
        <img src={current.url} alt={current.label || alt} />
      </div>
    </div>
  );
}
