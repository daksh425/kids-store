import { z } from "zod";
import { markPaymentFailed } from "@/lib/orders";
import { getBrowserOrderIds } from "@/lib/session";

const Body = z.object({ orderId: z.string().min(1), reason: z.string().max(300).default("Payment failed") });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  // Only the browser that started the order can mark it failed.
  if (!(await getBrowserOrderIds()).includes(parsed.data.orderId)) return new Response(null, { status: 403 });
  await markPaymentFailed(parsed.data.orderId, parsed.data.reason);
  return new Response(null, { status: 204 });
}
