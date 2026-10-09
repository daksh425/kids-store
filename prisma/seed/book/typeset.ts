// Typesets a novel from Markdown chapters into a 6×9" trade-paperback PDF:
// illustrated cover, front matter, contents with real page numbers, chapter
// openers with drop caps, justified body text with widow/orphan control,
// running heads, folios, scene-break ornaments and a back cover.
//
// Markdown subset: "# Title" per chapter, blank-line paragraphs, *italic*,
// **bold**, "* * *" scene breaks. A paragraph that is entirely italic or bold
// (a text message, a business card, a note) is set centred.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { LineCapStyle, PDFDocument, PDFFont, PDFPage, RGB, rgb } from "pdf-lib";

const W = 432; // 6in
const H = 648; // 9in
const TOP = H - 62; // first baseline on a text page
const BOTTOM = 66; // lowest baseline
const INNER = 58; // gutter margin
const OUTER = 48;
const TEXT_W = W - INNER - OUTER;
const SIZE = 10.3;
const LEADING = 16;
const INDENT = 15;

function hex(h: string): RGB {
  const n = Number.parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
const PAPER = hex("#FFFCF6");
const INK = hex("#2B2533");
const SOFT = hex("#8C8197");
const GOLD = hex("#B88A3B");
const GOLD_LIGHT = hex("#E7C87F");
const ROSE = hex("#C2456E");
const BLUSH = hex("#F3A9C1");
const NIGHT_TOP = [0x12, 0x0c, 0x2c];
const NIGHT_BOTTOM = [0x3d, 0x1f, 0x52];

export type BookMeta = {
  title: string;
  /** Title split for the cover: line 1, script word, line 3 */
  coverLines: [string, string, string];
  kicker: string;
  tagline: [string, string];
  imprint: string;
  dedication: string;
  copyright: string[];
  blurb: string[];
  closingNote: string[];
};

type Fonts = { body: PDFFont; italic: PDFFont; bold: PDFFont; display: PDFFont; script: PDFFont };
type FontKey = "body" | "italic" | "bold";
type Seg = { text: string; font: FontKey; size?: number };
type Word = { segs: Seg[]; width: number };
type Chapter = { number: number; title: string; blocks: string[] };

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

// ---------------------------------------------------------------- parsing

export function readChapters(dir: string): Chapter[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file, i) => {
      const raw = readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n");
      const [first, ...rest] = raw.split("\n");
      const title = first.replace(/^#\s*/, "").trim();
      const blocks = rest
        .join("\n")
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean);
      return { number: i + 1, title, blocks };
    });
}

function inlineSegs(text: string, base: FontKey = "body", size?: number): Seg[] {
  const segs: Seg[] = [];
  let italic = false;
  let bold = false;
  let buf = "";
  const flush = () => {
    if (buf) segs.push({ text: buf, font: bold ? "bold" : italic ? "italic" : base, size });
    buf = "";
  };
  for (let i = 0; i < text.length; i++) {
    if (text.startsWith("**", i)) {
      flush();
      bold = !bold;
      i++;
    } else if (text[i] === "*") {
      flush();
      italic = !italic;
    } else buf += text[i];
  }
  flush();
  return segs;
}

// ---------------------------------------------------------------- layout helpers

class Book {
  doc: PDFDocument;
  fonts: Fonts;
  meta: BookMeta;
  page!: PDFPage;
  y = TOP;
  chapterTitle = "";
  /** Pages that open a chapter or are front matter: no running head */
  bare = new Set<number>();
  /** Page numbers to hide the folio on */
  noFolio = new Set<number>();

  constructor(doc: PDFDocument, fonts: Fonts, meta: BookMeta) {
    this.doc = doc;
    this.fonts = fonts;
    this.meta = meta;
  }

  font(key: FontKey) {
    return this.fonts[key];
  }

  segWidth(s: Seg) {
    return this.font(s.font).widthOfTextAtSize(s.text, s.size ?? SIZE);
  }

  spaceWidth(size = SIZE) {
    return this.fonts.body.widthOfTextAtSize(" ", size);
  }

  /** Space after a word, at that word's own size (small print gets small spaces). */
  spaceFor(word: Word) {
    return this.spaceWidth(word.segs[0]?.size ?? SIZE);
  }

  /** Splits styled segments into words, keeping style changes inside a word (e.g. *ting*.). */
  words(segs: Seg[]): Word[] {
    const words: Word[] = [];
    let current: Seg[] = [];
    const push = () => {
      if (current.length) words.push({ segs: current, width: current.reduce((w, s) => w + this.segWidth(s), 0) });
      current = [];
    };
    for (const seg of segs) {
      const parts = seg.text.split(/(\s+)/);
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) push();
        else current.push({ ...seg, text: part });
      }
    }
    push();
    return words;
  }

  newPage(paper = true) {
    this.page = this.doc.addPage([W, H]);
    if (paper) this.page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
    this.y = TOP;
    return this.page;
  }

  pageNumber() {
    return this.doc.getPageCount();
  }

  /** Left edge of the text block: odd pages are rectos (gutter on the left). */
  left() {
    return this.pageNumber() % 2 === 1 ? INNER : OUTER;
  }

  ensureTextPage() {
    if (this.y < BOTTOM) this.newPage();
  }

  /** Greedy line breaking with per-line widths (drop caps narrow the first lines). */
  breakLines(words: Word[], widthFor: (line: number) => number) {
    const lines: Word[][] = [];
    let line: Word[] = [];
    let width = 0;
    for (const word of words) {
      const add = line.length ? this.spaceFor(word) + word.width : word.width;
      if (line.length && width + add > widthFor(lines.length)) {
        lines.push(line);
        line = [word];
        width = word.width;
      } else {
        line.push(word);
        width += add;
      }
    }
    if (line.length) lines.push(line);
    return lines;
  }

  drawWord(word: Word, x: number, y: number, color = INK) {
    for (const s of word.segs) {
      this.page.drawText(s.text, { x, y, size: s.size ?? SIZE, font: this.font(s.font), color });
      x += this.segWidth(s);
    }
  }

  drawLine(line: Word[], x: number, y: number, width: number, justify: boolean) {
    const natural = line.reduce((w, wd) => w + wd.width, 0);
    const gaps = line.length - 1;
    let gap = this.spaceFor(line[line.length - 1]);
    if (justify && gaps > 0) {
      const stretched = (width - natural) / gaps;
      // A very loose line (one huge word) reads worse justified than ragged.
      if (stretched < gap * 2.6) gap = stretched;
    }
    for (const word of line) {
      this.drawWord(word, x, y);
      x += word.width + gap;
    }
  }

  /** Body paragraph with indent, optional drop cap, justification and widow/orphan control. */
  paragraph(text: string, opts: { indent: boolean; dropCap?: boolean }) {
    const segs = inlineSegs(text);
    let cap: { letter: string; size: number; width: number } | null = null;

    if (opts.dropCap) {
      const first = segs[0];
      const letter = first.text[0];
      first.text = first.text.slice(1);
      // Cap top level with the first line's capitals, baseline on the third line.
      // Abril Fatface capitals are about 0.7 of the em.
      const size = (2 * LEADING + SIZE * 0.7) / 0.7;
      cap = { letter, size, width: this.fonts.display.widthOfTextAtSize(letter, size) + 8 };
    }

    const words = this.words(segs);
    if (cap) {
      // Small-caps lead-in: the rest of the opening words in capitals.
      for (const w of words.slice(0, 3)) {
        w.segs = w.segs.map((sg) => ({ ...sg, text: sg.text.toUpperCase(), size: SIZE * 0.86 }));
        w.width = w.segs.reduce((acc, sg) => acc + this.segWidth(sg), 0);
      }
    }
    const capLines = cap ? 3 : 0;
    const widthFor = (i: number) => TEXT_W - (i === 0 && opts.indent ? INDENT : 0) - (i < capLines && cap ? cap.width : 0);
    const lines = this.breakLines(words, widthFor);

    let i = 0;
    while (i < lines.length) {
      if (this.y < BOTTOM) this.newPage();
      const fit = Math.floor((this.y - BOTTOM) / LEADING) + 1;
      const remaining = lines.length - i;
      // Orphan: never leave a paragraph's first line alone at the foot of a page.
      if (i === 0 && fit === 1 && remaining > 1 && !cap) {
        this.y = BOTTOM - 1;
        continue;
      }
      let take = Math.min(fit, remaining);
      // Widow: never carry a paragraph's last line alone onto the next page.
      if (remaining - take === 1 && take >= 2) take -= 1;
      for (let k = 0; k < take; k++, i++) {
        const indent = i === 0 && opts.indent ? INDENT : 0;
        const capShift = i < capLines && cap ? cap.width : 0;
        if (i === 0 && cap) {
          // Drop cap baseline sits on the third line's baseline.
          this.page.drawText(cap.letter, {
            x: this.left(),
            y: this.y - 2 * LEADING,
            size: cap.size,
            font: this.fonts.display,
            color: ROSE,
          });
        }
        const last = i === lines.length - 1;
        this.drawLine(lines[i], this.left() + indent + capShift, this.y, widthFor(i), !last);
        this.y -= LEADING;
      }
      if (i < lines.length) this.y = BOTTOM - 1; // force a page break
    }
  }

  /** Centred block: text messages, the business card, notes. Explicit line breaks kept. */
  centred(text: string) {
    this.y -= LEADING * 0.4;
    for (const raw of text.split("\n")) {
      const words = this.words(inlineSegs(raw.trim()));
      for (const line of this.breakLines(words, () => TEXT_W - 30)) {
        if (this.y < BOTTOM) this.newPage();
        const width = line.reduce((w, wd) => w + wd.width, 0) + this.spaceFor(line[0]) * (line.length - 1);
        this.drawLine(line, this.left() + (TEXT_W - width) / 2, this.y, width, false);
        this.y -= LEADING;
      }
    }
    this.y -= LEADING * 0.4;
  }

  ornament(cx: number, y: number, color = GOLD, scale = 1) {
    const d = (x: number, s: number) =>
      this.page.drawSvgPath(`M 0 ${-s} L ${s} 0 L 0 ${s} L ${-s} 0 Z`, { x, y, color });
    d(cx, 3.2 * scale);
    d(cx - 11 * scale, 1.8 * scale);
    d(cx + 11 * scale, 1.8 * scale);
    this.page.drawLine({ start: { x: cx - 48 * scale, y }, end: { x: cx - 17 * scale, y }, thickness: 0.6, color });
    this.page.drawLine({ start: { x: cx + 17 * scale, y }, end: { x: cx + 48 * scale, y }, thickness: 0.6, color });
  }

  sceneBreak() {
    if (this.y - LEADING * 2.5 < BOTTOM) this.newPage();
    this.y -= LEADING * 0.35;
    this.ornament(this.left() + TEXT_W / 2, this.y + 3, GOLD, 0.8);
    this.y -= LEADING * 1.3;
  }

  /** Letter-spaced single line, centred on a given x. */
  spaced(text: string, cx: number, y: number, font: PDFFont, size: number, tracking: number, color: RGB) {
    const chars = [...text];
    const total = chars.reduce((w, c) => w + font.widthOfTextAtSize(c, size), 0) + tracking * (chars.length - 1);
    let x = cx - total / 2;
    for (const c of chars) {
      this.page.drawText(c, { x, y, size, font, color });
      x += font.widthOfTextAtSize(c, size) + tracking;
    }
  }

  centreText(text: string, y: number, font: PDFFont, size: number, color: RGB, cx = W / 2) {
    this.page.drawText(text, { x: cx - font.widthOfTextAtSize(text, size) / 2, y, size, font, color });
  }

  chapterOpening(ch: Chapter, epilogue: boolean) {
    this.newPage();
    this.bare.add(this.pageNumber());
    const cx = this.left() + TEXT_W / 2;
    const [label, title] = epilogue ? ["Epilogue", ch.title.replace(/^Epilogue:\s*/i, "")] : [`Chapter ${NUMBER_WORDS[ch.number]}`, ch.title];
    this.centreText(label, H - 150, this.fonts.script, 30, ROSE, cx);
    this.spaced(title.toUpperCase(), cx, H - 184, this.fonts.body, 11.5, 2.2, INK);
    this.ornament(cx, H - 204);
    this.y = H - 250;
    this.chapterTitle = title;
  }

  /** Running heads and folios, applied once every page exists. */
  finishPages(firstNumbered: number) {
    const pages = this.doc.getPages();
    pages.forEach((page, idx) => {
      const n = idx + 1;
      if (n < firstNumbered || this.noFolio.has(n)) return;
      this.page = page;
      const folio = String(n - firstNumbered + 1);
      this.centreText(folio, 34, this.fonts.body, 8.5, SOFT, (n % 2 === 1 ? INNER : OUTER) + TEXT_W / 2);
    });
  }

  runningHead(title: string) {
    const n = this.pageNumber();
    if (this.bare.has(n)) return;
    const cx = this.left() + TEXT_W / 2;
    const text = n % 2 === 0 ? this.meta.title.toUpperCase() : title.toUpperCase();
    this.spaced(text, cx, H - 36, this.fonts.body, 6.8, 1.6, SOFT);
  }
}

// ---------------------------------------------------------------- artwork

function nightSky(page: PDFPage) {
  const bands = 120;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const c = NIGHT_TOP.map((v, k) => (v + (NIGHT_BOTTOM[k] - v) * t) / 255);
    page.drawRectangle({ x: 0, y: H - (i + 1) * (H / bands), width: W, height: H / bands + 1, color: rgb(c[0], c[1], c[2]) });
  }
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Polygon in page coordinates (y up). */
function poly(page: PDFPage, pts: [number, number][], opts: { color?: RGB; borderColor?: RGB; borderWidth?: number; opacity?: number }) {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${H - y}`).join(" ") + " Z";
  page.drawSvgPath(d, { x: 0, y: H, ...opts });
}

function sparkle(page: PDFPage, x: number, y: number, r: number, color: RGB, opacity = 1) {
  poly(page, [
    [x, y + r],
    [x + r * 0.22, y + r * 0.22],
    [x + r, y],
    [x + r * 0.22, y - r * 0.22],
    [x, y - r],
    [x - r * 0.22, y - r * 0.22],
    [x - r, y],
    [x - r * 0.22, y + r * 0.22],
  ], { color, opacity });
}

function stars(page: PDFPage, rand: () => number, top = H - 30, bottom = 250) {
  for (let i = 0; i < 70; i++) {
    page.drawCircle({ x: 20 + rand() * (W - 40), y: bottom + rand() * (top - bottom), size: 0.4 + rand() * 1.1, color: rgb(1, 1, 1), opacity: 0.25 + rand() * 0.6 });
  }
  for (let i = 0; i < 7; i++) sparkle(page, 40 + rand() * (W - 80), bottom + 40 + rand() * (top - bottom - 60), 3 + rand() * 4, GOLD_LIGHT, 0.85);
}

/** Mumbai at night: towers with lit windows, the sea link, and the bay. */
function skyline(page: PDFPage, rand: () => number) {
  // the bay
  page.drawRectangle({ x: 0, y: 0, width: W, height: 62, color: hex("#0A0619") });
  for (let i = 0; i < 26; i++) {
    const y = 8 + rand() * 48;
    const x = rand() * W;
    page.drawLine({ start: { x, y }, end: { x: x + 10 + rand() * 30, y }, thickness: 0.6, color: GOLD_LIGHT, opacity: 0.18 + rand() * 0.3 });
  }
  // distant towers
  let x = 14;
  while (x < W - 14) {
    const w = 12 + rand() * 22;
    // Kept below the cover tagline (about y=175).
    const h = 26 + rand() * (x > 150 && x < 270 ? 78 : 52);
    page.drawRectangle({ x, y: 62, width: w, height: h, color: hex("#1C1238") });
    for (let wy = 70; wy < 62 + h - 6; wy += 7) {
      for (let wx = x + 3; wx < x + w - 3; wx += 5) {
        if (rand() < 0.28) page.drawRectangle({ x: wx, y: wy, width: 1.6, height: 2.4, color: GOLD_LIGHT, opacity: 0.55 + rand() * 0.4 });
      }
    }
    x += w + 2 + rand() * 4;
  }
  // the sea link: two cable-stayed pylons and a deck
  const deckY = 76;
  page.drawLine({ start: { x: 0, y: deckY }, end: { x: W, y: deckY }, thickness: 2.2, color: hex("#0E0822") });
  for (const px of [96, 150]) {
    poly(page, [
      [px - 4, deckY],
      [px + 4, deckY],
      [px + 1.2, deckY + 92],
      [px - 1.2, deckY + 92],
    ], { color: hex("#0E0822") });
    for (let k = 1; k <= 9; k++) {
      const top = deckY + 88 - k * 3;
      page.drawLine({ start: { x: px, y: top }, end: { x: px - k * 6, y: deckY }, thickness: 0.35, color: GOLD_LIGHT, opacity: 0.55 });
      page.drawLine({ start: { x: px, y: top }, end: { x: px + k * 6, y: deckY }, thickness: 0.35, color: GOLD_LIGHT, opacity: 0.55 });
    }
  }
  for (let lx = 6; lx < W; lx += 9) page.drawCircle({ x: lx, y: deckY + 1.5, size: 0.7, color: GOLD_LIGHT, opacity: 0.8 });
}

function ring(page: PDFPage, cx: number, cy: number, s = 1) {
  // band, seen at an angle
  page.drawEllipse({ x: cx, y: cy, xScale: 40 * s, yScale: 15 * s, borderColor: hex("#9C7428"), borderWidth: 8 * s });
  page.drawEllipse({ x: cx, y: cy + 1 * s, xScale: 40 * s, yScale: 15 * s, borderColor: GOLD_LIGHT, borderWidth: 4.5 * s });
  page.drawEllipse({ x: cx, y: cy + 2 * s, xScale: 39 * s, yScale: 14 * s, borderColor: hex("#FFF1C9"), borderWidth: 0.8 * s, opacity: 0.8 });
  // diamond: pavilion, crown and table
  const top = cy + 15 * s;
  const girdle = top + 14 * s;
  const table = girdle + 9 * s;
  poly(page, [
    [cx - 21 * s, girdle],
    [cx + 21 * s, girdle],
    [cx, top - 2 * s],
  ], { color: hex("#BFD6F7") });
  poly(page, [
    [cx - 21 * s, girdle],
    [cx - 11 * s, table],
    [cx + 11 * s, table],
    [cx + 21 * s, girdle],
  ], { color: hex("#E9F2FF") });
  const facet = { color: undefined, borderColor: hex("#8FB2E6"), borderWidth: 0.5 * s };
  poly(page, [[cx - 11 * s, table], [cx - 7 * s, girdle], [cx, top - 2 * s], [cx - 7 * s, girdle], [cx - 21 * s, girdle]], facet);
  poly(page, [[cx + 11 * s, table], [cx + 7 * s, girdle], [cx, top - 2 * s], [cx + 7 * s, girdle], [cx + 21 * s, girdle]], facet);
  page.drawLine({ start: { x: cx - 21 * s, y: girdle }, end: { x: cx + 21 * s, y: girdle }, thickness: 0.6 * s, color: hex("#8FB2E6") });
  page.drawLine({ start: { x: cx, y: table }, end: { x: cx, y: top - 2 * s }, thickness: 0.4 * s, color: hex("#8FB2E6") });
  // seed pearls round the setting
  for (let k = -3; k <= 3; k++) page.drawCircle({ x: cx + k * 6.4 * s, y: top + 1 * s - Math.abs(k) * 0.6 * s, size: 2.1 * s, color: hex("#FFF8EE"), borderColor: hex("#E6D5BC"), borderWidth: 0.4 * s });
  // light
  sparkle(page, cx + 14 * s, table + 9 * s, 7 * s, rgb(1, 1, 1), 0.95);
  sparkle(page, cx - 18 * s, table + 2 * s, 3.5 * s, GOLD_LIGHT, 0.9);
}

function frame(page: PDFPage) {
  page.drawRectangle({ x: 14, y: 14, width: W - 28, height: H - 28, borderColor: GOLD_LIGHT, borderWidth: 0.8, opacity: 0, borderOpacity: 0.75 });
  page.drawRectangle({ x: 19, y: 19, width: W - 38, height: H - 38, borderColor: GOLD_LIGHT, borderWidth: 0.35, opacity: 0, borderOpacity: 0.5 });
}

function cover(b: Book) {
  const page = b.newPage(false);
  const rand = seeded(7);
  nightSky(page);
  stars(page, rand);
  skyline(page, rand);
  frame(page);
  const cx = W / 2;
  b.spaced(b.meta.kicker.toUpperCase(), cx, H - 58, b.fonts.body, 7.5, 2.6, GOLD_LIGHT);
  ring(page, cx, 448, 1.35);
  const [l1, script, l3] = b.meta.coverLines;
  b.spaced(l1, cx, 352, b.fonts.display, 37, 2.4, GOLD_LIGHT);
  b.centreText(script, 284, b.fonts.script, 96, BLUSH);
  b.spaced(l3, cx, 232, b.fonts.display, 50, 2.6, GOLD_LIGHT);
  b.centreText(b.meta.tagline[0], 196, b.fonts.italic, 10.5, rgb(1, 1, 1));
  b.centreText(b.meta.tagline[1], 181, b.fonts.italic, 10.5, rgb(1, 1, 1));
  b.spaced(b.meta.imprint.toUpperCase(), cx, 30, b.fonts.body, 7, 2.4, GOLD_LIGHT);
}

function insideCover(b: Book) {
  const page = b.newPage(false);
  nightSky(page);
  stars(page, seeded(19), H - 30, 40);
  frame(page);
  b.ornament(W / 2, H / 2 + 52, GOLD_LIGHT);
  b.centreText("Rule One:", H / 2 + 6, b.fonts.script, 30, BLUSH);
  b.centreText("nobody falls in love.", H / 2 - 30, b.fonts.script, 30, GOLD_LIGHT);
  b.centreText("written on a napkin, Bandra", H / 2 - 62, b.fonts.italic, 8.5, rgb(1, 1, 1));
  b.ornament(W / 2, H / 2 - 88, GOLD_LIGHT);
}

function titlePage(b: Book) {
  b.newPage();
  b.bare.add(b.pageNumber());
  b.noFolio.add(b.pageNumber());
  const cx = b.left() + TEXT_W / 2;
  const [l1, script, l3] = b.meta.coverLines;
  b.spaced(l1, cx, H - 220, b.fonts.display, 27, 2, INK);
  b.centreText(script, H - 270, b.fonts.script, 62, ROSE, cx);
  b.spaced(l3, cx, H - 312, b.fonts.display, 34, 2, INK);
  b.ornament(cx, H - 346);
  b.centreText(b.meta.kicker, H - 372, b.fonts.italic, 10, SOFT, cx);
  b.spaced(b.meta.imprint.toUpperCase(), cx, 92, b.fonts.body, 7.5, 2.4, GOLD);
}

function copyrightPage(b: Book) {
  b.newPage();
  b.bare.add(b.pageNumber());
  b.noFolio.add(b.pageNumber());
  let y = 210;
  for (const para of b.meta.copyright) {
    const words = b.words(inlineSegs(para, "body", 7.6));
    for (const line of b.breakLines(words, () => TEXT_W)) {
      b.drawLine(line, b.left(), y, TEXT_W, false);
      y -= 11.5;
    }
    y -= 7;
  }
}

function dedicationPage(b: Book) {
  b.newPage();
  b.bare.add(b.pageNumber());
  b.noFolio.add(b.pageNumber());
  const cx = b.left() + TEXT_W / 2;
  b.ornament(cx, H - 236);
  b.centreText(b.meta.dedication, H - 268, b.fonts.italic, 11.5, INK, cx);
}

// ---------------------------------------------------------------- the book

export async function typesetBook(opts: {
  meta: BookMeta;
  chaptersDir: string;
  fontsDir: string;
  /** Build a sample: only these chapter numbers, plus a "keep reading" page */
  sampleChapters?: number[];
  sampleCallToAction?: string[];
}) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const load = (f: string) => readFileSync(path.join(opts.fontsDir, f));
  const fonts: Fonts = {
    body: await doc.embedFont(load("LibreBaskerville-Regular.ttf"), { subset: true }),
    italic: await doc.embedFont(load("LibreBaskerville-Italic.ttf"), { subset: true }),
    bold: await doc.embedFont(load("LibreBaskerville-Bold.ttf"), { subset: true }),
    display: await doc.embedFont(load("AbrilFatface-Regular.ttf"), { subset: true }),
    script: await doc.embedFont(load("GreatVibes-Regular.ttf"), { subset: true }),
  };
  doc.setTitle(opts.meta.title + (opts.sampleChapters ? " (free sample)" : ""));
  doc.setAuthor(opts.meta.imprint);
  doc.setCreator(opts.meta.imprint);
  doc.setLanguage("en-IN");

  const b = new Book(doc, fonts, opts.meta);
  const all = readChapters(opts.chaptersDir);
  const chapters = opts.sampleChapters ? all.filter((c) => opts.sampleChapters!.includes(c.number)) : all;

  cover(b); // 1
  insideCover(b); // 2
  titlePage(b); // 3
  copyrightPage(b); // 4
  dedicationPage(b); // 5
  b.newPage(); // 6: contents, filled in once chapter pages are known
  const contentsPage = b.page;
  b.bare.add(6);
  b.noFolio.add(6);
  const firstNumbered = 7;

  const starts: { title: string; label: string; page: number }[] = [];
  const headTitles = new Map<number, string>();

  for (const ch of chapters) {
    const epilogue = /^Epilogue/i.test(ch.title);
    b.chapterOpening(ch, epilogue);
    starts.push({
      title: epilogue ? ch.title.replace(/^Epilogue:\s*/i, "") : ch.title,
      label: epilogue ? "Epilogue" : String(ch.number),
      page: b.pageNumber(),
    });
    let afterBreak = true;
    let firstPara = true;
    for (const block of ch.blocks) {
      if (block === "* * *") {
        b.sceneBreak();
        afterBreak = true;
        continue;
      }
      // Entirely bold or entirely italic (no other markers inside), or with line breaks: set centred.
      const isCentred = /^\*\*[^*]+\*\*$/.test(block) || (/^\*[^*]+\*$/.test(block) && block.length < 220) || block.includes("\n");
      const before = b.pageNumber();
      if (isCentred) b.centred(block);
      else b.paragraph(block, { indent: !afterBreak, dropCap: firstPara });
      for (let p = before; p <= b.pageNumber(); p++) headTitles.set(p, b.chapterTitle);
      afterBreak = false;
      firstPara = false;
    }
  }

  // Closing pages
  b.newPage();
  b.bare.add(b.pageNumber());
  const cx = b.left() + TEXT_W / 2;
  if (opts.sampleChapters) {
    b.centreText("Enjoyed Chapter One?", H - 200, b.fonts.script, 30, ROSE, cx);
    b.ornament(cx, H - 226);
    let y = H - 270;
    for (const para of opts.sampleCallToAction ?? []) {
      const words = b.words(inlineSegs(para, "body", 10.5));
      for (const line of b.breakLines(words, () => TEXT_W - 30)) {
        const width = line.reduce((w, wd) => w + wd.width, 0) + b.spaceFor(line[0]) * (line.length - 1);
        b.drawLine(line, b.left() + (TEXT_W - width) / 2, y, width, false);
        y -= 17;
      }
      y -= 10;
    }
  } else {
    b.centreText("Thank you for reading", H - 200, b.fonts.script, 30, ROSE, cx);
    b.ornament(cx, H - 226);
    b.y = H - 270;
    for (const para of opts.meta.closingNote) b.centred(para);
  }

  // Keep the page count even so the back cover closes the book on its own.
  if (doc.getPageCount() % 2 === 0) {
    b.newPage();
    b.noFolio.add(b.pageNumber());
    b.bare.add(b.pageNumber());
  }
  backCover(b);
  b.noFolio.add(b.pageNumber());
  b.noFolio.add(1);
  b.noFolio.add(2);

  // Running heads (need final pages and the chapter on each)
  doc.getPages().forEach((page, idx) => {
    const n = idx + 1;
    const title = headTitles.get(n);
    if (!title) return;
    b.page = page;
    // left() depends on the current page count, so position from the page number directly
    const left = n % 2 === 1 ? INNER : OUTER;
    if (b.bare.has(n)) return;
    const text = n % 2 === 0 ? opts.meta.title.toUpperCase() : title.toUpperCase();
    b.spaced(text, left + TEXT_W / 2, H - 36, b.fonts.body, 6.8, 1.6, SOFT);
  });

  // Contents
  b.page = contentsPage;
  const left = 6 % 2 === 1 ? INNER : OUTER;
  b.centreText("Contents", H - 120, b.fonts.script, 34, ROSE, left + TEXT_W / 2);
  b.ornament(left + TEXT_W / 2, H - 142);
  let y = H - 190;
  const rowGap = starts.length > 8 ? 24 : 30;
  for (const s of starts) {
    const folio = String(s.page - firstNumbered + 1);
    const label = s.label === "Epilogue" ? "" : `${s.label}.`;
    b.page.drawText(label, { x: left, y, size: 9.5, font: fonts.body, color: GOLD });
    const titleX = left + 24;
    const titleText = s.label === "Epilogue" ? `Epilogue: ${s.title}` : s.title;
    b.page.drawText(titleText, { x: titleX, y, size: 10.5, font: fonts.italic, color: INK });
    const fw = fonts.body.widthOfTextAtSize(folio, 10);
    b.page.drawText(folio, { x: left + TEXT_W - fw, y, size: 10, font: fonts.body, color: INK });
    // dot leader
    const start = titleX + fonts.italic.widthOfTextAtSize(titleText, 10.5) + 6;
    for (let dx = start; dx < left + TEXT_W - fw - 6; dx += 5) b.page.drawCircle({ x: dx, y: y + 2.5, size: 0.45, color: SOFT });
    y -= rowGap;
  }

  b.finishPages(firstNumbered);
  const bytes = await doc.save();
  return { bytes, pages: doc.getPageCount(), chapterStarts: starts };
}

function backCover(b: Book) {
  const page = b.newPage(false);
  const rand = seeded(31);
  nightSky(page);
  stars(page, rand, H - 30, H - 175);
  skyline(page, rand);
  frame(page);
  ring(page, W / 2, H - 120, 0.75);
  let y = H - 196;
  const width = 300;
  for (const para of b.meta.blurb) {
    const italic = para.startsWith("*") && para.endsWith("*");
    const segs = inlineSegs(para, "body", 10.4).map((s) => ({ ...s }));
    const words = b.words(segs);
    for (const line of b.breakLines(words, () => width)) {
      const lw = line.reduce((w, wd) => w + wd.width, 0) + b.spaceFor(line[0]) * (line.length - 1);
      let x = W / 2 - lw / 2;
      for (const word of line) {
        b.drawWord(word, x, y, italic ? GOLD_LIGHT : rgb(1, 1, 1));
        x += word.width + b.spaceFor(word);
      }
      y -= 15.5;
    }
    y -= 9;
  }
  b.spaced("SWEET & CLEAN ROMANCE", W / 2, 196, b.fonts.body, 7, 2.2, GOLD_LIGHT);
  b.spaced(b.meta.imprint.toUpperCase(), W / 2, 30, b.fonts.body, 7, 2.4, GOLD_LIGHT);
  page.drawLine({ start: { x: W / 2 - 40, y: 186 }, end: { x: W / 2 + 40, y: 186 }, thickness: 0.4, color: GOLD_LIGHT, lineCap: LineCapStyle.Round });
}
