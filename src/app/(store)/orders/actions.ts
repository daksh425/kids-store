"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { appUrl, emailDeliveryEnabled, isProduction } from "@/lib/config";
import { db } from "@/lib/db";
import { sendLoginLink } from "@/lib/email";
import { endCustomerSession } from "@/lib/session";

export type LinkState = { sent?: boolean; error?: string; devLink?: string };

export async function requestLoginLink(_prev: LinkState, form: FormData): Promise<LinkState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Please enter a valid email address." };

  const user = await db.user.findUnique({ where: { email: email.data } });
  // Same response whether or not the email has orders, so this can't be used to probe who shops here.
  if (!user) return { sent: true };

  const token = randomBytes(32).toString("base64url");
  await db.loginToken.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  const link = `${appUrl()}/orders/login?token=${token}`;
  await sendLoginLink(user.email, link);

  // Local development without SMTP: nothing can actually arrive, so show the link.
  return { sent: true, devLink: !isProduction && !emailDeliveryEnabled() ? link : undefined };
}

export async function signOut() {
  await endCustomerSession();
  redirect("/orders");
}
