import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { paymentMode, sessionSecret } from "./config";

// Razorpay over plain REST. The key secret is read here and nowhere else, and
// this module is server-only, so it can't be bundled into browser code.

const API = "https://api.razorpay.com/v1";

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys are not configured.");
  return { keyId, keySecret };
}

/** The public key id the browser needs to open Checkout. Not a secret. */
export function publicKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

if (process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") && process.env.NODE_ENV !== "production") {
  console.warn("[razorpay] LIVE keys are set in development. Use rzp_test_ keys until you go live.");
}

export async function createRazorpayOrder(params: { amountRupees: number; receipt: string; notes?: Record<string, string> }) {
  const { keyId, keySecret } = credentials();
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountRupees * 100,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as { id: string; amount: number; currency: string; status: string };
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Demo mode has no Razorpay account, so it signs with a secret derived from
 * SESSION_SECRET. The verification code path is identical either way.
 */
function signingSecret() {
  if (paymentMode() === "razorpay") return credentials().keySecret;
  return createHmac("sha256", sessionSecret()).update("demo-razorpay").digest("hex");
}

function paymentSignature(razorpayOrderId: string, razorpayPaymentId: string) {
  return createHmac("sha256", signingSecret()).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest("hex");
}

/** Razorpay's documented check: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
  return safeEqualHex(paymentSignature(razorpayOrderId, razorpayPaymentId), signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

// ---------- demo mode (local development without keys) ----------

export function demoOrderId() {
  return `order_demo_${randomBytes(7).toString("hex")}`;
}

/** What Razorpay Checkout would hand the browser after a successful payment. */
export function demoPaymentResult(razorpayOrderId: string) {
  if (paymentMode() !== "demo") throw new Error("Demo payments are only available in local development.");
  const razorpayPaymentId = `pay_demo_${randomBytes(7).toString("hex")}`;
  return {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: paymentSignature(razorpayOrderId, razorpayPaymentId),
  };
}
