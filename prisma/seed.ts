// Seeds the starter catalogue: generates each product's PDF and cover into
// storage/, then upserts the product rows. Safe to re-run; it overwrites the
// seed files and product details but never touches orders or customers.

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ageLabel, CATEGORIES, STORE_NAME } from "../src/lib/catalog";
import { coverSvg } from "./seed/cover";
import { cover, createKit, finishDocument } from "./seed/pdf-kit";
import { SEED_PRODUCTS } from "./seed/products";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const STORAGE = path.join(process.cwd(), "storage");
const FILES = path.join(STORAGE, "files");
const THUMBS = path.join(STORAGE, "thumbnails");

async function main() {
  await mkdir(FILES, { recursive: true });
  await mkdir(THUMBS, { recursive: true });

  const now = Date.now();
  for (const p of SEED_PRODUCTS) {
    const category = CATEGORIES.find((c) => c.slug === p.category)!;

    const k = await createKit({ title: p.title, storeName: STORE_NAME, accent: category.color, ink: category.ink, tint: category.tint });
    cover(k, { subtitle: p.shortDescription, ageLabel: ageLabel(p.ageGroup), category: category.name });
    p.build(k);
    const pdf = await finishDocument(k);
    const pages = k.doc.getPageCount();

    const fileName = `seed-${p.slug}.pdf`;
    const thumbName = `seed-${p.slug}.svg`;
    await writeFile(path.join(FILES, fileName), pdf);
    await writeFile(
      path.join(THUMBS, thumbName),
      coverSvg({
        title: p.title,
        categoryLabel: category.short,
        ageLabel: ageLabel(p.ageGroup),
        emoji: p.emoji,
        color: category.color,
        tint: category.tint,
        ink: category.ink,
        free: p.price === 0,
      }),
    );

    const data = {
      title: p.title,
      shortDescription: p.shortDescription,
      description: p.description,
      category: p.category,
      ageGroup: p.ageGroup,
      price: p.price,
      discountPrice: p.discountPrice ?? null,
      featured: p.featured ?? false,
      includes: p.includes,
      pages,
      format: "PDF",
      file: fileName,
      fileName: `${p.slug}.pdf`,
      fileSize: pdf.byteLength,
      thumbnail: thumbName,
      status: "PUBLISHED" as const,
    };
    await db.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data, createdAt: new Date(now - p.ageDays * 86_400_000) },
      update: data,
    });
    console.log(`  ✓ ${p.title} (${pages} pages, ${Math.round(pdf.byteLength / 1024)} KB)`);
  }

  const coupons = [
    { code: "WELCOME10", type: "PERCENT" as const, value: 10, minOrder: 0 },
    { code: "FLAT50", type: "FLAT" as const, value: 50, minOrder: 199 },
  ];
  for (const c of coupons) {
    await db.coupon.upsert({ where: { code: c.code }, create: c, update: {} });
  }

  console.log(`Seeded ${SEED_PRODUCTS.length} products and ${coupons.length} coupons.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
