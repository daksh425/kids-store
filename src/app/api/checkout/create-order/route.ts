import { z } from "zod";
import { createCheckoutOrder } from "@/lib/orders";
import { rememberBrowserOrder } from "@/lib/session";

const Body = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email address.").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d\s-]*$/, "Please enter a valid phone number.")
    .optional()
    .nullable(),
  productIds: z.array(z.string().max(40)).min(1, "Your cart is empty.").max(50),
  couponCode: z.string().max(40).optional().nullable(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ kind: "error", error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  }
  const result = await createCheckoutOrder(parsed.data);
  // This browser placed the order, so it may open the order page without signing in.
  if (result.kind !== "error") await rememberBrowserOrder(result.orderId);
  return Response.json(result, { status: result.kind === "error" ? 400 : 200 });
}
