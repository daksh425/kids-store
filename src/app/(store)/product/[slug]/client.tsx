"use client";

import { Download, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { CartItem } from "@/lib/client/cart";
import { track } from "@/lib/client/track";
import { submitReview, type ReviewState } from "./actions";

export function ViewTracker({ productId, title, price }: { productId: string; title: string; price: number }) {
  useEffect(() => {
    track("product_view", productId, { currency: "INR", value: price, items: [{ item_id: productId, item_name: title }] });
  }, [productId, title, price]);
  return null;
}

export function BuyBox({ item }: { item: CartItem }) {
  if (item.price === 0) {
    return (
      <Link href={`/checkout?buy=${item.id}`} className="btn btn-lg btn-sunny w-full sm:w-auto">
        <Download size={20} /> Get it free
      </Link>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href={`/checkout?buy=${item.id}`} className="btn btn-lg btn-primary flex-1">
        <Zap size={20} /> Buy now
      </Link>
      <AddToCartButton item={item} className="btn-lg flex-1" />
    </div>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, {});
  const [rating, setRating] = useState(5);

  if (state.ok) {
    return <p className="rounded-2xl bg-mint-50 p-4 font-bold text-mint-ink">Thanks for your review! It helps other parents choose.</p>;
  }

  return (
    <form action={action} className="rounded-3xl bg-cream p-5">
      <p className="font-display text-lg font-semibold">You bought this. How did it go?</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="rounded-lg p-0.5"
          >
            <Star size={28} className={n <= rating ? "fill-sunny text-[#E0B42C]" : "text-navy/25"} />
          </button>
        ))}
      </div>
      <textarea name="comment" required minLength={5} maxLength={1000} rows={3} className="field mt-3" placeholder="What did your child enjoy?" />
      {state.error ? <p className="mt-2 text-sm font-bold text-coral-ink">{state.error}</p> : null}
      <button className="btn btn-primary mt-3" disabled={pending}>
        {pending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}
