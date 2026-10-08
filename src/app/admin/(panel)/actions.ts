"use server";

import { randomBytes } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AGE_GROUPS, CATEGORIES } from "@/lib/catalog";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/email";
import { slugify } from "@/lib/format";
import { normalizeCouponCode } from "@/lib/pricing";
import { endAdminSession, requireAdmin } from "@/lib/session";
import { saveProductFile, saveThumbnail } from "@/lib/storage";

export async function signOutAdmin() {
  await endAdminSession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- products

const optionalInt = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(0).optional());

const ProductInput = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(3, "Title is too short.").max(120),
    slug: z.string().trim().max(80).optional(),
    shortDescription: z.string().trim().max(200).default(""),
    description: z.string().trim().min(10, "Add a description (at least a sentence)."),
    category: z.enum(CATEGORIES.map((c) => c.slug) as [string, ...string[]]),
    ageGroup: z.enum(AGE_GROUPS.map((a) => a.slug) as [string, ...string[]]),
    price: z.coerce.number().int("Price must be whole rupees.").min(0),
    discountPrice: optionalInt,
    pages: optionalInt,
    format: z.string().trim().max(40).default("PDF"),
    includes: z.string().default(""),
    featured: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  })
  .refine((d) => d.discountPrice == null || d.discountPrice < d.price, {
    message: "Sale price must be lower than the regular price.",
    path: ["discountPrice"],
  });

export type ProductFormState = { error?: string };

function fileFrom(form: FormData, name: string) {
  const f = form.get(name);
  return f instanceof File && f.size > 0 ? f : null;
}

export async function saveProduct(_prev: ProductFormState, form: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = ProductInput.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  const slug = slugify(d.slug || d.title);
  if (!slug) return { error: "Please give the product a title with letters or numbers." };
  const clash = await db.product.findFirst({ where: { slug, ...(d.id ? { id: { not: d.id } } : {}) } });
  if (clash) return { error: `Another product already uses the link "${slug}". Change the URL slug.` };

  const existing = d.id ? await db.product.findUnique({ where: { id: d.id } }) : null;
  if (d.id && !existing) return { error: "That product no longer exists." };

  const pdf = fileFrom(form, "file");
  const thumb = fileFrom(form, "thumbnail");
  if (d.status === "PUBLISHED" && !pdf && !existing?.file) {
    return { error: "Upload the product file before publishing (or save as a draft)." };
  }

  let fileFields = {};
  let thumbFields = {};
  try {
    if (pdf) {
      const saved = await saveProductFile(pdf);
      fileFields = { file: saved.name, fileName: saved.originalName, fileSize: saved.size };
    }
    if (thumb) thumbFields = { thumbnail: (await saveThumbnail(thumb)).name };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }

  const data = {
    title: d.title,
    slug,
    shortDescription: d.shortDescription,
    description: d.description,
    category: d.category,
    ageGroup: d.ageGroup,
    price: d.price,
    discountPrice: d.discountPrice ?? null,
    pages: d.pages ?? null,
    format: d.format || "PDF",
    includes: d.includes
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    featured: d.featured === "on",
    status: d.status,
    ...fileFields,
    ...thumbFields,
  };

  if (existing) await db.product.update({ where: { id: existing.id }, data });
  else await db.product.create({ data });
  updateTag("products");
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const sold = await db.orderItem.count({ where: { productId: id } });
  updateTag("products");
  if (sold > 0) {
    // Orders reference it; keep history intact and just take it off sale.
    await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    redirect("/admin/products?archived=1");
  }
  await db.product.delete({ where: { id } });
  redirect("/admin/products?deleted=1");
}

// ---------------------------------------------------------------- coupons

const CouponInput = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters.")
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _ only."),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.coerce.number().int().min(1, "Enter a discount."),
  minOrder: z.coerce.number().int().min(0).default(0),
  maxUses: optionalInt,
  expiresAt: z.string().optional(),
});

export type CouponFormState = { error?: string; ok?: boolean };

export async function createCoupon(_prev: CouponFormState, form: FormData): Promise<CouponFormState> {
  await requireAdmin();
  const parsed = CouponInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  if (d.type === "PERCENT" && d.value > 100) return { error: "A percentage can't be more than 100." };
  const code = normalizeCouponCode(d.code);
  if (await db.coupon.findUnique({ where: { code } })) return { error: `${code} already exists.` };
  await db.coupon.create({
    data: {
      code,
      type: d.type,
      value: d.value,
      minOrder: d.minOrder,
      maxUses: d.maxUses ?? null,
      // End of the chosen day, India time.
      expiresAt: d.expiresAt ? new Date(`${d.expiresAt}T23:59:59+05:30`) : null,
    },
  });
  refresh();
  return { ok: true };
}

export async function toggleCoupon(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const coupon = await db.coupon.findUniqueOrThrow({ where: { id } });
  await db.coupon.update({ where: { id }, data: { active: !coupon.active } });
  refresh();
}

// ---------------------------------------------------------------- downloads & orders

export async function resetDownload(form: FormData) {
  await requireAdmin();
  const days = Number(process.env.DOWNLOAD_EXPIRY_DAYS) || 30;
  await db.download.update({
    where: { id: String(form.get("id")) },
    data: { downloadCount: 0, expiresAt: new Date(Date.now() + days * 86_400_000) },
  });
  refresh();
}

export async function revokeDownload(form: FormData) {
  await requireAdmin();
  // A fresh token kills any link that has been shared around.
  await db.download.update({
    where: { id: String(form.get("id")) },
    data: { downloadToken: randomBytes(24).toString("base64url") },
  });
  refresh();
}

export async function resendOrderEmail(form: FormData) {
  await requireAdmin();
  await sendOrderConfirmation(String(form.get("id")));
  refresh();
}

export async function deleteMessage(form: FormData) {
  await requireAdmin();
  await db.contactMessage.delete({ where: { id: String(form.get("id")) } });
  refresh();
}
