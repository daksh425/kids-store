import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { CATEGORIES } from "@/lib/catalog";
import { appUrl } from "@/lib/config";
import { db } from "@/lib/db";

// Every public page plus every live product, for search engines.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const base = appUrl();
  const products = await db.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
  const pages = ["", "/kids", "/free-resources", "/bundles", "/about", "/contact", "/terms", "/privacy", "/refund-policy"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...CATEGORIES.map((c) => ({ url: `${base}/kids/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.9 })),
  ];
}
