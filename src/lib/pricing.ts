import { inr } from "./format";

export function effectivePrice(p: { price: number; discountPrice: number | null }) {
  return p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;
}

export function discountPercent(p: { price: number; discountPrice: number | null }) {
  const now = effectivePrice(p);
  if (now >= p.price || p.price === 0) return 0;
  return Math.round(((p.price - now) / p.price) * 100);
}

type CouponLike = {
  type: "PERCENT" | "FLAT";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: Date | null;
};

export type CouponResult = { ok: true; discount: number } | { ok: false; error: string };

export function applyCoupon(coupon: CouponLike | null, subtotal: number, now = new Date()): CouponResult {
  if (!coupon || !coupon.active) return { ok: false, error: "That coupon code isn't valid." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: "That coupon has expired." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "That coupon has been fully used." };
  }
  if (subtotal < coupon.minOrder) {
    return { ok: false, error: `Add ${inr(coupon.minOrder - subtotal)} more to use this coupon.` };
  }
  const raw = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return { ok: true, discount: Math.min(raw, subtotal) };
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}
