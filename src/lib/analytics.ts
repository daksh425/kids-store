import "server-only";
import { db } from "./db";

export const CLIENT_EVENTS = ["product_view", "add_to_cart", "checkout_start"] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type EventType = ClientEvent | "payment_success" | "download";

export async function trackEvent(type: EventType, opts: { productId?: string | null; sessionId?: string | null } = {}) {
  try {
    await db.event.create({ data: { type, productId: opts.productId ?? null, sessionId: opts.sessionId ?? null } });
  } catch (err) {
    // Analytics must never break a purchase or a download.
    console.error("[analytics] failed to record", type, err);
  }
}
