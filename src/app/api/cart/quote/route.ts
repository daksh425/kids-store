import { z } from "zod";
import { quoteCart } from "@/lib/orders";

const Body = z.object({
  productIds: z.array(z.string().max(40)).max(50),
  couponCode: z.string().max(40).optional().nullable(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const quote = await quoteCart(parsed.data.productIds, parsed.data.couponCode);
  return Response.json({ ...quote, couponId: undefined });
}
