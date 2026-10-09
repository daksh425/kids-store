// Grown-up Reads: novels typeset from Markdown into designed PDFs.

import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { typesetBook, type BookMeta } from "./book/typeset";

const ROOT = path.join(process.cwd(), "prisma", "seed");
const FILES = path.join(process.cwd(), "storage", "files");
const THUMBS = path.join(process.cwd(), "storage", "thumbnails");

const imprint = "BrightBuds Reads";

export const BILLIONAIRE_FAKE_FIANCEE: BookMeta = {
  title: "Billionaire Fake Fiancée",
  coverLines: ["BILLIONAIRE", "Fake", "FIANCÉE"],
  kicker: "A sweet Mumbai romance",
  tagline: ["One contract. Six weeks.", "Zero chance of falling in love."],
  imprint,
  dedication: "For everyone who has ever read at the table.",
  copyright: [
    "**Billionaire Fake Fiancée**",
    `Copyright © ${new Date().getFullYear()} ${imprint}. All rights reserved.`,
    "This is a work of fiction. Names, characters, businesses, places and events are products of the author’s imagination or are used fictitiously. Any resemblance to actual persons, living or dead, or to real companies, is purely coincidental. Rathore Group, the Sea Palace Hotel and 14 Sea Lane are fictional.",
    "This e-book is licensed for your personal enjoyment only. Please don’t share or resell it; if you’d like to share it, buy an extra copy for a friend. Thank you for supporting independent stories.",
    "Typeset in Libre Baskerville, with Abril Fatface and Great Vibes, all under the SIL Open Font License.",
    "First edition.",
  ],
  blurb: [
    "Tara Mehta has thirty-seven days to save her late father’s bookshop. Kabir Rathore has six weeks to convince his formidable grandmother that he is more than a glass tower.",
    "One spilled glass of chai later, they have a deal: a fake engagement, five rules written on a napkin, and a ten-year lease.",
    "*Rule One: nobody falls in love.*",
    "*Rule Five: nobody gets hurt.*",
    "They are both very good at keeping promises. Until the monsoon, a locked library and a jar of 1971 pickle start rewriting the rules.",
  ],
  closingNote: [
    "If Tara and Kabir made you smile, tell a friend, or leave a review on the BrightBuds website. It truly helps.",
    "*More Grown-up Reads are on their way.*",
  ],
};

export async function seedBooks(db: PrismaClient) {
  await mkdir(FILES, { recursive: true });
  await mkdir(THUMBS, { recursive: true });
  const slug = "billionaire-fake-fiancee";
  const common = {
    meta: BILLIONAIRE_FAKE_FIANCEE,
    chaptersDir: path.join(ROOT, "books", slug),
    fontsDir: path.join(ROOT, "fonts"),
  };

  const book = await typesetBook(common);
  const sample = await typesetBook({
    ...common,
    sampleChapters: [1],
    sampleCallToAction: [
      "Tara has just thrown chai on a billionaire. And she’s fairly sure he owns her building.",
      "The rest of the story (the napkin, the pickle, the locked library and the eightieth birthday) is waiting in the full book.",
      "*Find it at BrightBuds, in Grown-up Reads.*",
    ],
  });

  const fileName = `seed-${slug}.pdf`;
  const sampleName = `sample-${slug}.pdf`;
  const thumbName = `seed-${slug}.jpg`;
  await writeFile(path.join(FILES, fileName), book.bytes);
  await writeFile(path.join(FILES, sampleName), sample.bytes);
  // The cover thumbnail is a rendered image of page one, kept in the repo (see prisma/seed/assets).
  await copyFile(path.join(ROOT, "assets", `${slug}-cover.jpg`), path.join(THUMBS, thumbName)).catch(() => {
    console.warn(`  ! missing prisma/seed/assets/${slug}-cover.jpg; product will have no cover image`);
  });

  const data = {
    title: BILLIONAIRE_FAKE_FIANCEE.title,
    shortDescription: "A bookseller, a billionaire, and a fake engagement written on a napkin. A sweet, swoony Mumbai romance.",
    description:
      "Tara Mehta has thirty-seven days to save her late father’s bookshop on Sea Lane. Kabir Rathore, the reclusive CEO whose company now owns her building, has six weeks to prove to his formidable grandmother that he is more than a glass tower.\n\nOne monsoon afternoon and one spilled glass of chai later, they strike a deal: a fake engagement until his grandmother’s eightieth birthday, five rules written on a napkin, and a ten-year lease for her shop.\n\nRule One: nobody falls in love.\n\nBut between Sunday lunches on Malabar Hill, a terrible first dance, late-night vada pav on the forty-second floor and a library that has been locked for twenty years, the rules start to bend. And when a jealous cousin threatens to expose everything at the biggest party of the year, Tara and Kabir must decide whether what they have was ever really pretend.",
    category: "grown-up-reads",
    ageGroup: "adult",
    price: 199,
    discountPrice: 99,
    featured: true,
    includes: [
      "Complete novella: 10 chapters + epilogue (about 15,000 words)",
      "Sweet & clean romance: banter and kisses, no explicit scenes",
      "Beautifully designed 6×9\" book with illustrated cover",
      "Read it online as a page-turning book, or download the PDF",
    ],
    pages: book.pages,
    format: "PDF e-book",
    file: fileName,
    fileName: "Billionaire Fake Fiancee - BrightBuds Reads.pdf",
    fileSize: book.bytes.byteLength,
    sampleFile: sampleName,
    thumbnail: thumbName,
    status: "PUBLISHED" as const,
  };
  await db.product.upsert({ where: { slug }, create: { slug, ...data }, update: data });
  console.log(`  ✓ ${data.title} (${book.pages} pages, sample ${sample.pages} pages)`);
  return { book, sample };
}
