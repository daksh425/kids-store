"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkAdminPassword, startAdminSession } from "@/lib/session";

// Small in-memory brake on password guessing. Resets when the server restarts.
const attempts = new Map<string, { count: number; until: number }>();

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.count >= 5 && entry.until > now) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD is not set in .env." };
  if (!checkAdminPassword(String(form.get("password") ?? ""))) {
    const count = entry && entry.until > now ? entry.count + 1 : 1;
    attempts.set(ip, { count, until: now + 10 * 60 * 1000 });
    return { error: "That password isn't right." };
  }

  attempts.delete(ip);
  await startAdminSession();
  redirect("/admin");
}
