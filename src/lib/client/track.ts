"use client";

type TrackType = "product_view" | "add_to_cart" | "checkout_start";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sessionId() {
  try {
    let id = localStorage.getItem("ks_sid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("ks_sid", id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Records a funnel step in the store's own analytics and, if configured, Google Analytics. */
export function track(type: TrackType, productId?: string, ga?: Record<string, unknown>) {
  const body = JSON.stringify({ type, productId, sessionId: sessionId() });
  try {
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch {}
  const gaName = { product_view: "view_item", add_to_cart: "add_to_cart", checkout_start: "begin_checkout" }[type];
  window.gtag?.("event", gaName, ga ?? {});
}
