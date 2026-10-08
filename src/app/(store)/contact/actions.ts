"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const Input = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.email("Please enter a valid email address."),
  message: z.string().trim().min(10, "Please write a little more so we can help.").max(3000),
});

export type ContactState = { ok?: boolean; error?: string };

export async function sendMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  const parsed = Input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  await db.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
