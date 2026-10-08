import { db } from "@/lib/db";
import { finalizeOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Backup path for when the customer closes the tab before the browser callback
// reaches us. Configure in Razorpay Dashboard → Webhooks with events
// payment.captured and order.paid, and the same secret as RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return new Response("Invalid signature", { status: 400 });

  type Payload = {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id?: string } }; order?: { entity?: { id: string } } };
  };
  const event = JSON.parse(raw) as Payload;
  if (event.event !== "payment.captured" && event.event !== "order.paid") return new Response("ignored");

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  if (!razorpayOrderId) return new Response("no order id");

  const order = await db.order.findUnique({ where: { razorpayOrderId } });
  if (order) await finalizeOrder(order.id, { method: "razorpay", razorpayPaymentId: payment?.id });
  return new Response("ok");
}
