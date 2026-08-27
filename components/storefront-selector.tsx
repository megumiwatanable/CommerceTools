"use client";

import { useState } from "react";
import type { StorefrontOption } from "@/lib/storefront-context";

export default function StorefrontSelector({
  stores,
  initialStoreKey,
  initialCountry,
}: {
  stores: StorefrontOption[];
  initialStoreKey: string;
  initialCountry: string;
}) {
  const [storeKey, setStoreKey] = useState(initialStoreKey);
  const [country, setCountry] = useState(initialCountry);
  const activeStore =
    stores.find((store) => store.key === storeKey) ?? stores[0];

  function selectStore(nextStoreKey: string) {
    const nextStore = stores.find((store) => store.key === nextStoreKey);
    if (!nextStore?.countries[0]) return;
    setStoreKey(nextStoreKey);
    setCountry(nextStore.countries[0].code);
    updateContext(nextStoreKey, nextStore.countries[0].code);
  }

  return (
    <div className="storefront-selector">
      {stores.length > 1 && (
        <>
          <label htmlFor="shopping-store">Store</label>
          <select
            id="shopping-store"
            value={storeKey}
            onChange={(event) => selectStore(event.target.value)}
            className="select"
          >
            {stores.map((store) => (
              <option key={store.key} value={store.key}>
                {store.name}
              </option>
            ))}
          </select>
        </>
      )}
      <label htmlFor="shopping-country">Shopping from</label>
      <select
        id="shopping-country"
        value={country}
        onChange={(event) => {
          setCountry(event.target.value);
          updateContext(activeStore.key, event.target.value);
        }}
        className="select"
      >
        {activeStore.countries.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

async function updateContext(storeKey: string, country: string) {
  const response = await fetch("/api/storefront", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeKey, country }),
  });
  if (response.ok) window.location.reload();
}
