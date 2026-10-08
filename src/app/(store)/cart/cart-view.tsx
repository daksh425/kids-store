"use client";

import { ArrowRight, Lock, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CouponField, SummaryLines } from "@/components/store/order-summary";
import { getCategory } from "@/lib/catalog";
import { getSavedCoupon, saveCoupon, useCart, useHydrated } from "@/lib/client/cart";
import { useQuote } from "@/lib/client/quote";
import { inr } from "@/lib/format";
import { thumbnailUrl } from "@/lib/media";

export function CartView() {
  const hydrated = useHydrated();
  const cart = useCart();
  // Read once on the client; the skeleton shows until hydration, so SSR never renders it.
  const [coupon, setCoupon] = useState(getSavedCoupon);
  const { quote, loading } = useQuote(hydrated ? cart.items.map((i) => i.id) : null, coupon);

  // Drop anything the store no longer sells, so checkout can't fail on it.
  const missingKey = quote?.missing.join(",") ?? "";
  useEffect(() => {
    if (missingKey) cart.removeMany(missingKey.split(","));
  }, [missingKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCoupon = (code: string) => {
    setCoupon(code);
    saveCoupon(code);
  };

  if (!hydrated || (loading && !quote)) {
    return <div className="card h-64 animate-pulse" aria-busy="true" />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary-50 text-primary">
          <ShoppingBag size={30} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-muted">Find something fun to print and learn with.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/kids" className="btn btn-primary">
            Browse resources
          </Link>
          <Link href="/free-resources" className="btn btn-outline">
            Free resources
          </Link>
        </div>
      </div>
    );
  }

  const priceOf = (id: string) => quote?.items.find((i) => i.id === id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <ul className="card divide-y divide-line">
        {cart.items.map((item) => {
          const live = priceOf(item.id);
          const category = getCategory(item.category);
          const thumb = thumbnailUrl(item.thumbnail);
          return (
            <li key={item.id} className="flex items-center gap-4 p-4 sm:p-5">
              <Link href={`/product/${item.slug}`} className="h-24 w-18 shrink-0 overflow-hidden rounded-2xl" style={{ background: category?.tint }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${item.slug}`} className="font-display text-lg font-semibold hover:text-primary">
                  {item.title}
                </Link>
                <p className="text-sm text-muted">{category?.short} · Instant PDF download</p>
                <p className="mt-1 font-bold">
                  {live ? inr(live.price) : inr(item.price)}
                  {live && live.originalPrice > live.price ? <s className="ml-2 text-sm font-normal text-muted">{inr(live.originalPrice)}</s> : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => cart.remove(item.id)}
                className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-coral-50 hover:text-coral-ink"
                aria-label={`Remove ${item.title}`}
              >
                <Trash2 size={18} />
              </button>
            </li>
          );
        })}
      </ul>

      <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold">Order summary</h2>
        <CouponField key={coupon} code={coupon} onApply={applyCoupon} error={quote?.coupon && !quote.coupon.ok ? quote.coupon.error : undefined} />
        {quote ? <SummaryLines quote={quote} /> : null}
        <Link href="/checkout" className="btn btn-lg btn-primary w-full">
          Checkout <ArrowRight size={20} />
        </Link>
        <p className="flex items-center justify-center gap-2 text-xs font-bold text-muted">
          <Lock size={14} /> Secure payment via Razorpay
        </p>
      </aside>
    </div>
  );
}
