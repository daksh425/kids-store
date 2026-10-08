import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { effectivePrice } from "./pricing";

export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  category: true,
  ageGroup: true,
  price: true,
  discountPrice: true,
  thumbnail: true,
  pages: true,
  featured: true,
  createdAt: true,
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;
export type ProductCardData = CardRow & { rating: number | null; reviewCount: number };

async function withRatings(rows: CardRow[]): Promise<ProductCardData[]> {
  if (rows.length === 0) return [];
  const stats = await db.review.groupBy({
    by: ["productId"],
    where: { productId: { in: rows.map((r) => r.id) } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const byId = new Map(stats.map((s) => [s.productId, s]));
  return rows.map((r) => {
    const s = byId.get(r.id);
    return { ...r, rating: s?._avg.rating ?? null, reviewCount: s?._count._all ?? 0 };
  });
}

export type ProductSort = "popular" | "newest" | "price-asc" | "price-desc";

export async function listProducts(opts: {
  category?: string;
  ageGroup?: string;
  free?: boolean;
  paidOnly?: boolean;
  sort?: ProductSort;
  limit?: number;
  excludeId?: string;
} = {}) {
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };
  if (opts.category) where.category = opts.category;
  if (opts.ageGroup) where.ageGroup = opts.ageGroup;
  if (opts.free) where.price = 0;
  if (opts.paidOnly) where.price = { gt: 0 };
  if (opts.excludeId) where.id = { not: opts.excludeId };

  if (opts.sort === "popular" || !opts.sort) return bestSellers({ where, limit: opts.limit });

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    opts.sort === "newest" ? { createdAt: "desc" } : { price: opts.sort === "price-asc" ? "asc" : "desc" };
  const rows = await db.product.findMany({ where, orderBy, take: opts.limit, select: cardSelect });
  if (opts.sort === "price-asc" || opts.sort === "price-desc") {
    // Sort on what the customer actually pays, not the list price.
    const dir = opts.sort === "price-asc" ? 1 : -1;
    rows.sort((a, b) => (effectivePrice(a) - effectivePrice(b)) * dir);
  }
  return withRatings(rows);
}

/** Ranked by paid sales, then the admin's "featured" flag, then newest. */
export async function bestSellers(opts: { where?: Prisma.ProductWhereInput; limit?: number } = {}) {
  const rows = await db.product.findMany({
    where: opts.where ?? { status: "PUBLISHED", price: { gt: 0 } },
    select: {
      ...cardSelect,
      _count: { select: { orderItems: { where: { order: { status: "PAID" } } } } },
    },
  });
  rows.sort(
    (a, b) =>
      b._count.orderItems - a._count.orderItems ||
      Number(b.featured) - Number(a.featured) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const limited = opts.limit ? rows.slice(0, opts.limit) : rows;
  return withRatings(limited);
}

export async function newArrivals(limit = 4) {
  const rows = await db.product.findMany({
    where: { status: "PUBLISHED", price: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return withRatings(rows);
}

export async function getPublishedProduct(slug: string) {
  return db.product.findFirst({ where: { slug, status: "PUBLISHED" } });
}

/** Title/description for <head>. Cached so metadata doesn't block navigation; admin edits call updateTag("products"). */
export async function getProductMeta(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return db.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, shortDescription: true, description: true, thumbnail: true },
  });
}

export async function getProductReviews(productId: string) {
  const [reviews, agg] = await Promise.all([
    db.review.findMany({ where: { productId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  return { reviews, rating: agg._avg.rating, count: agg._count._all };
}

export async function relatedProducts(p: { id: string; category: string; ageGroup: string }) {
  const [sameCategory, bundles] = await Promise.all([
    db.product.findMany({
      where: { status: "PUBLISHED", id: { not: p.id }, OR: [{ category: p.category }, { ageGroup: p.ageGroup }] },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: cardSelect,
    }),
    p.category === "learning-packs"
      ? Promise.resolve([])
      : db.product.findMany({
          where: { status: "PUBLISHED", category: "learning-packs", id: { not: p.id } },
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          take: 6,
          select: cardSelect,
        }),
  ]);
  // Prefer the same category, then same age; keep bundles in their own row.
  const ranked = sameCategory
    .filter((r) => r.category !== "learning-packs" || p.category === "learning-packs")
    .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category))
    .slice(0, 4);
  const sameAgeBundles = bundles.sort((a, b) => Number(b.ageGroup === p.ageGroup) - Number(a.ageGroup === p.ageGroup)).slice(0, 2);
  const [related, relatedBundles] = await Promise.all([withRatings(ranked), withRatings(sameAgeBundles)]);
  return { related, bundles: relatedBundles };
}

export async function categoryCounts() {
  const rows = await db.product.groupBy({ by: ["category"], where: { status: "PUBLISHED" }, _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.category, r._count._all])) as Record<string, number>;
}
