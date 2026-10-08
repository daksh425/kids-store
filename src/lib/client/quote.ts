"use client";

import { useEffect, useState } from "react";

export type ClientQuote = {
  items: { id: string; slug: string; title: string; thumbnail: string | null; category: string; price: number; originalPrice: number }[];
  missing: string[];
  subtotal: number;
  discount: number;
  total: number;
  coupon: { code: string; ok: boolean; error?: string } | null;
};

const EMPTY_QUOTE: ClientQuote = { items: [], missing: [], subtotal: 0, discount: 0, total: 0, coupon: null };

/**
 * Live server-side quote for a set of product ids. Prices never come from
 * localStorage. Pass null while the cart hasn't loaded yet.
 */
export function useQuote(productIds: string[] | null, couponCode: string) {
  const ids = productIds ? productIds.join(",") : null;
  const requestKey = ids ? `${ids}|${couponCode}` : null;
  const [result, setResult] = useState<{ key: string; quote: ClientQuote } | null>(null);

  useEffect(() => {
    if (!requestKey || !ids) return;
    let cancelled = false;
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: ids.split(","), couponCode: couponCode || null }),
    })
      .then((r) => r.json())
      .then((quote: ClientQuote) => {
        if (!cancelled) setResult({ key: requestKey, quote });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [requestKey, ids, couponCode]);

  if (ids === null) return { quote: null, loading: true };
  if (ids === "") return { quote: EMPTY_QUOTE, loading: false };
  // Keep showing the previous quote while a new one (e.g. after a coupon) loads.
  return { quote: result?.quote ?? null, loading: result?.key !== requestKey };
}
