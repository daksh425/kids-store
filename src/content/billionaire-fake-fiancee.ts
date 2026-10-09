import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

// Marketing copy for the Billionaire Fake Fiancée landing page. The excerpt is
// read from the manuscript itself so the page always matches the book.

export const BOOK_SLUG = "billionaire-fake-fiancee";

export const tropes = [
  "Fake dating",
  "Billionaire romance",
  "Grumpy × sunshine",
  "Bookish heroine",
  "Formidable grandmother",
  "Monsoon Mumbai",
  "Found family",
  "Sweet & clean",
];

export const rules = [
  "Nobody falls in love.",
  "No kissing, unless absolutely necessary in front of witnesses.",
  "It ends on the night of the birthday party.",
  "The shop stays, whatever happens.",
  "Nobody gets hurt.",
];

export const characters = [
  {
    name: "Tara Mehta",
    role: "The bookseller",
    line: "Twenty-seven, stubborn, funny, and thirty-seven days from losing her late father’s bookshop on Sea Lane. Cannot whistle. Will not be bought.",
  },
  {
    name: "Kabir Rathore",
    role: "The billionaire",
    line: "Reclusive CEO of the Rathore Group. Holds old books very carefully. Has not eaten a vada pav since college, or said his mother’s name in twenty years.",
  },
  {
    name: "Savitri “Dadi” Rathore",
    role: "The grandmother",
    line: "Turning eighty, built a steel empire from one workshop, and notices everything. Especially shoes. Especially lies.",
  },
  {
    name: "Vikram Rathore",
    role: "The cousin",
    line: "Golden, charming, and building a forty-floor tower with a rooftop pool exactly where Tara’s café is.",
  },
];

export const faqs = [
  {
    q: "Is it explicit?",
    a: "No. It’s a sweet, clean romance: plenty of banter, longing and a few very good kisses, but nothing explicit.",
  },
  {
    q: "How long is it?",
    a: "A complete novella of about 15,000 words: ten chapters and an epilogue. Most readers finish it in one cosy evening, around an hour and a half.",
  },
  {
    q: "How do I read it?",
    a: "Straight after paying, open it right in your browser as a page-turning book, on your phone, tablet or laptop. You can also download the PDF and keep it.",
  },
  {
    q: "Can I try before I buy?",
    a: "Yes. The whole of Chapter One is free to read online, no sign-up needed.",
  },
  {
    q: "Is it part of a series?",
    a: "It’s a complete story with a happy ending. It’s also the first BrightBuds Reads Original, with more grown-up stories on the way.",
  },
];

/** The opening scene of Chapter One, up to the first scene break. */
export function openingExcerpt() {
  const file = path.join(process.cwd(), "prisma", "seed", "books", BOOK_SLUG, "01.md");
  const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const body = raw.split("\n").slice(1).join("\n");
  const scene = body.split(/\n\s*\* \* \*\s*\n/)[0];
  return scene
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
