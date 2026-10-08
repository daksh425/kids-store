"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { findPurchase } from "@/lib/customer";
import { db } from "@/lib/db";

const ReviewInput = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Please write at least a few words.").max(1000),
});

export type ReviewState = { ok?: boolean; error?: string };

export async function submitReview(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const parsed = ReviewInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your review." };

  // Only verified buyers can review, and only once per product.
  const buyer = await findPurchase(parsed.data.productId);
  if (!buyer) return { error: "Only customers who bought this product can review it." };

  const firstName = buyer.name.split(" ")[0];
  const lastInitial = buyer.name.split(" ")[1]?.[0];
  await db.review.upsert({
    where: { productId_userId: { productId: parsed.data.productId, userId: buyer.id } },
    create: {
      productId: parsed.data.productId,
      userId: buyer.id,
      name: lastInitial ? `${firstName} ${lastInitial}.` : firstName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    update: { rating: parsed.data.rating, comment: parsed.data.comment },
  });
  refresh();
  return { ok: true };
}
