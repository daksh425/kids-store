import "server-only";
import { randomBytes } from "node:crypto";
import { trackEvent } from "./analytics";
import { STORE_NAME } from "./catalog";
import { downloadPolicy, paymentMode } from "./config";
import { db } from "./db";
import { sendOrderConfirmation } from "./email";
import { orderLabel } from "./format";
import { applyCoupon, effectivePrice, normalizeCouponCode } from "./pricing";
import { createRazorpayOrder, demoOrderId, publicKeyId } from "./razorpay";

export type QuoteItem = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  category: string;
  price: number;
  originalPrice: number;
};

export type Quote = {
  items: QuoteItem[];
  /** Ids from the cart that are no longer for sale */
  missing: string[];
  subtotal: number;
  discount: number;
  total: number;
  coupon: { code: string; ok: boolean; error?: string } | null;
  couponId: string | null;
};

/** Prices always come from the database, never from the browser's cart. */
export async function quoteCart(productIds: string[], couponCode?: string | null): Promise<Quote> {
  const ids = [...new Set(productIds)].slice(0, 50);
  const products = await db.product.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, thumbnail: true, category: true, price: true, discountPrice: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: QuoteItem[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) {
      missing.push(id);
      continue;
    }
    items.push({
      id: p.id,
      slug: p.slug,
      title: p.title,
      thumbnail: p.thumbnail,
      category: p.category,
      price: effectivePrice(p),
      originalPrice: p.price,
    });
  }
  const subtotal = items.reduce((sum, i) => sum + i.price, 0);

  let discount = 0;
  let coupon: Quote["coupon"] = null;
  let couponId: string | null = null;
  const code = couponCode ? normalizeCouponCode(couponCode) : "";
  if (code) {
    const row = await db.coupon.findUnique({ where: { code } });
    const result = applyCoupon(row, subtotal);
    if (result.ok && row) {
      discount = result.discount;
      couponId = row.id;
      coupon = { code, ok: true };
    } else {
      coupon = { code, ok: false, error: result.ok ? undefined : result.error };
    }
  }

  return { items, missing, subtotal, discount, total: subtotal - discount, coupon, couponId };
}

export type CheckoutInput = {
  name: string;
  email: string;
  phone?: string | null;
  productIds: string[];
  couponCode?: string | null;
};

export type CheckoutResult =
  | { kind: "error"; error: string }
  | { kind: "paid"; orderId: string }
  | {
      kind: "pay";
      orderId: string;
      mode: "razorpay" | "demo";
      razorpayOrderId: string;
      amountPaise: number;
      keyId: string;
      storeName: string;
      description: string;
      prefill: { name: string; email: string; contact: string };
    };

export async function createCheckoutOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const quote = await quoteCart(input.productIds, input.couponCode);
  if (quote.items.length === 0) return { kind: "error", error: "Your cart is empty." };
  if (quote.missing.length > 0) {
    return { kind: "error", error: "Some items in your cart are no longer available. Please review your cart." };
  }
  if (quote.coupon && !quote.coupon.ok) return { kind: "error", error: quote.coupon.error ?? "Invalid coupon." };

  const mode = paymentMode();
  if (quote.total > 0 && mode === "unconfigured") {
    return { kind: "error", error: "Payments are not set up yet. Please try again later." };
  }

  const email = input.email.trim().toLowerCase();
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: input.name.trim(), phone: input.phone?.trim() || null },
    update: { name: input.name.trim(), ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}) },
  });

  const order = await db.order.create({
    data: {
      userId: user.id,
      subtotal: quote.subtotal,
      discount: quote.discount,
      amount: quote.total,
      couponId: quote.couponId,
      couponCode: quote.coupon?.ok ? quote.coupon.code : null,
      items: { create: quote.items.map((i) => ({ productId: i.id, title: i.title, price: i.price })) },
    },
  });

  if (quote.total === 0) {
    await finalizeOrder(order.id, { method: "free" });
    return { kind: "paid", orderId: order.id };
  }

  // "unconfigured" with a non-zero total already returned above.
  const payMode = mode === "razorpay" ? "razorpay" : "demo";
  let razorpayOrderId: string;
  if (payMode === "razorpay") {
    try {
      const rp = await createRazorpayOrder({
        amountRupees: quote.total,
        receipt: `order_${order.number}`,
        notes: { orderId: order.id },
      });
      razorpayOrderId = rp.id;
    } catch (err) {
      console.error("[checkout]", err);
      await db.order.update({ where: { id: order.id }, data: { status: "FAILED", failureReason: "Could not reach Razorpay" } });
      return { kind: "error", error: "We couldn't start the payment. Please try again in a moment." };
    }
  } else {
    razorpayOrderId = demoOrderId();
  }

  await db.order.update({ where: { id: order.id }, data: { razorpayOrderId } });

  const description =
    quote.items.length === 1 ? quote.items[0].title : `${quote.items.length} items · order ${orderLabel(order.number)}`;

  return {
    kind: "pay",
    orderId: order.id,
    mode: payMode,
    razorpayOrderId,
    amountPaise: quote.total * 100,
    keyId: payMode === "razorpay" ? publicKeyId() : "",
    storeName: STORE_NAME,
    description,
    prefill: { name: user.name, email: user.email, contact: user.phone ?? "" },
  };
}

function downloadToken() {
  return randomBytes(24).toString("base64url");
}

/**
 * Marks an order PAID and issues its download tokens. Safe to call more than
 * once (browser callback and webhook can both arrive): only the call that
 * actually flips the status does the work and sends the email.
 */
export async function finalizeOrder(orderId: string, opts: { method: "razorpay" | "demo" | "free"; razorpayPaymentId?: string }) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + downloadPolicy.expiryDays * 24 * 60 * 60 * 1000);

  const newlyPaid = await db.$transaction(async (tx) => {
    const flipped = await tx.order.updateMany({
      where: { id: orderId, status: { not: "PAID" } },
      data: {
        status: "PAID",
        paidAt: now,
        paymentMethod: opts.method,
        razorpayPaymentId: opts.razorpayPaymentId ?? null,
        failureReason: null,
      },
    });
    if (flipped.count === 0) return null;

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    await tx.download.createMany({
      data: order.items.map((i) => ({
        orderId,
        productId: i.productId,
        downloadToken: downloadToken(),
        maxDownloads: downloadPolicy.limit,
        expiresAt,
      })),
      skipDuplicates: true,
    });
    if (order.couponId) {
      await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
    }
    return order;
  });

  if (!newlyPaid) return false;

  await trackEvent("payment_success");
  try {
    await sendOrderConfirmation(orderId);
  } catch (err) {
    console.error("[orders] confirmation email failed", err);
  }
  return true;
}

export async function markPaymentFailed(orderId: string, reason: string) {
  await db.order.updateMany({
    where: { id: orderId, status: "CREATED" },
    data: { status: "FAILED", failureReason: reason.slice(0, 300) },
  });
}
