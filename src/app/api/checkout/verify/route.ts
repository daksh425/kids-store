import { z } from "zod";
import { paymentMode } from "@/lib/config";
import { db } from "@/lib/db";
import { finalizeOrder } from "@/lib/orders";
import { verifyPaymentSignature } from "@/lib/razorpay";

const Body = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Razorpay Checkout's success handler posts here. The order only becomes PAID
// once the signature checks out against our server-side secret.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.razorpayOrderId !== razorpay_order_id) {
    return Response.json({ ok: false, error: "Order not found" }, { status: 404 });
  }
  if (order.status === "PAID") return Response.json({ ok: true, orderId });

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    console.warn(`[verify] bad signature for order ${orderId}`);
    return Response.json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
  }

  const mode = paymentMode();
  await finalizeOrder(orderId, { method: mode === "razorpay" ? "razorpay" : "demo", razorpayPaymentId: razorpay_payment_id });
  return Response.json({ ok: true, orderId });
}
