"use client";

import { useEffect, useState } from "react";

export default function FlashToast({ flash }: {
  flash: { type: "success" | "error"; message: string };
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    fetch("/api/flash", { method: "DELETE", keepalive: true }).catch(() => {});
    const timer = window.setTimeout(() => setVisible(false), 10_000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <div className={`flash-toast flash-${flash.type}`} role={flash.type === "error" ? "alert" : "status"}>
      <span>{flash.message}</span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss notification">×</button>
    </div>
  );
}
