"use client";

import { BadgePercent, X } from "lucide-react";
import { useState } from "react";
import { getCategory } from "@/lib/catalog";
import type { ClientQuote } from "@/lib/client/quote";
import { inr } from "@/lib/format";
import { thumbnailUrl } from "@/lib/media";

export function CouponField({ code, onApply, error }: { code: string; onApply: (code: string) => void; error?: string }) {
  const [value, setValue] = useState(code);
  if (code && !error) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-mint-50 px-4 py-3 text-sm font-bold text-mint-ink">
        <span className="flex items-center gap-2">
          <BadgePercent size={18} /> {code} applied
        </span>
        <button type="button" onClick={() => onApply("")} className="rounded-full p-1 hover:bg-white" aria-label="Remove coupon">
          <X size={16} />
        </button>
      </div>
    );
  }
  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onApply(value.trim().toUpperCase());
        }}
      >
        <label htmlFor="coupon" className="sr-only">
          Coupon code
        </label>
        <input id="coupon" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Coupon code" className="field !py-2 uppercase" />
        <button className="btn btn-outline shrink-0" disabled={!value.trim()}>
          Apply
        </button>
      </form>
      {error ? <p className="mt-2 text-sm font-bold text-coral-ink">{error}</p> : null}
    </div>
  );
}

export function SummaryLines({ quote }: { quote: ClientQuote }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="font-bold">{inr(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 ? (
        <div className="flex justify-between text-mint-ink">
          <dt>Coupon {quote.coupon?.code}</dt>
          <dd className="font-bold">−{inr(quote.discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between border-t border-line pt-3 text-lg">
        <dt className="font-display font-semibold">Total</dt>
        <dd className="font-display font-bold">{quote.total === 0 ? "Free" : inr(quote.total)}</dd>
      </div>
    </dl>
  );
}

export function MiniItem({ item }: { item: ClientQuote["items"][number] }) {
  const thumb = thumbnailUrl(item.thumbnail);
  const category = getCategory(item.category);
  return (
    <div className="flex items-center gap-3">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl" style={{ background: category?.tint }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.title}</p>
        <p className="text-xs text-muted">{category?.short} · PDF download</p>
      </div>
      <p className="font-bold">{item.price === 0 ? "Free" : inr(item.price)}</p>
    </div>
  );
}
