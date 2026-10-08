import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { startCustomerSession } from "@/lib/session";

// Consumes a one-time sign-in link from email and starts a customer session.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const used = await db.loginToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (used.count === 0) return Response.redirect(new URL("/orders?link=invalid", req.url), 303);

  const row = await db.loginToken.findUniqueOrThrow({ where: { tokenHash } });
  await startCustomerSession(row.userId);
  return Response.redirect(new URL("/orders", req.url), 303);
}
