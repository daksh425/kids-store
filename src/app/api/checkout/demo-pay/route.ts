import { z } from "zod";
import { paymentMode } from "@/lib/config";
import { db } from "@/lib/db";
import { demoPaymentResult } from "@/lib/razorpay";
import { getBrowserOrderIds } from "@/lib/session";

const Body = z.object({ orderId: z.string().min(1) });

// Stands in for Razorpay Checkout when no keys are configured. Refuses to run
// when real keys are set or in a production build (paymentMode is never "demo" there).
export async function POST(req: Request) {
  if (paymentMode() !== "demo") return Response.json({ error: "Demo payments are disabled." }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (!(await getBrowserOrderIds()).includes(parsed.data.orderId)) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  const order = await db.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order?.razorpayOrderId) return Response.json({ error: "Order not found" }, { status: 404 });
  return Response.json(demoPaymentResult(order.razorpayOrderId));
}
