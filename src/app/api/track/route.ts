import { z } from "zod";
import { CLIENT_EVENTS, trackEvent } from "@/lib/analytics";

const Body = z.object({
  type: z.enum(CLIENT_EVENTS),
  productId: z.string().max(40).optional().nullable(),
  sessionId: z.string().max(64).optional().nullable(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  await trackEvent(parsed.data.type, parsed.data);
  return new Response(null, { status: 204 });
}
