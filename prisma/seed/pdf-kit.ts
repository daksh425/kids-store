// Builds the sample product PDFs: real, printable pages (colouring outlines,
// mazes, worksheets, stories) so the purchase → download flow has something
// worth downloading. Standard PDF fonts only cover WinAnsi, so no ₹ or emoji.

import { LineCapStyle, PDFDocument, PDFFont, PDFPage, RGB, StandardFonts, rgb } from "pdf-lib";

export const W = 595.28;
export const H = 841.89;
const M = 48; // page margin

export function hex(h: string): RGB {
  const n = Number.parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const NAVY = hex("#25253A");
const GREY = hex("#8C8CA1");
const TRACE = hex("#C9C9D6");
const LINE = hex("#D9D4E8");
const WHITE = rgb(1, 1, 1);
const PALETTE = ["#D02B65", "#4DA3FF", "#FFD95A", "#72D6B1", "#FF7B6B"].map(hex);

export type Kit = {
  doc: PDFDocument;
  bold: PDFFont;
  regular: PDFFont;
  accent: RGB;
  /** Darker shade of the accent that is readable as text on white or the tint */
  ink: RGB;
  /** Text colour that reads on a solid accent background */
  onAccent: RGB;
  tint: RGB;
  rand: () => number;
  title: string;
  storeName: string;
  answers: string[];
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function isLight(h: string) {
  const n = Number.parseInt(h.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

export async function createKit(opts: { title: string; storeName: string; accent: string; ink: string; tint: string }): Promise<Kit> {
  const doc = await PDFDocument.create();
  doc.setTitle(opts.title);
  doc.setAuthor(opts.storeName);
  doc.setCreator(opts.storeName);
  return {
    doc,
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    regular: await doc.embedFont(StandardFonts.Helvetica),
    accent: hex(opts.accent),
    ink: hex(opts.ink),
    onAccent: isLight(opts.accent) ? NAVY : WHITE,
    tint: hex(opts.tint),
    rand: mulberry32(hashString(opts.title)),
    title: opts.title,
    storeName: opts.storeName,
    answers: [],
  };
}

function int(k: Kit, min: number, max: number) {
  return min + Math.floor(k.rand() * (max - min + 1));
}

function shuffle<T>(k: Kit, arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(k.rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function centerText(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = NAVY) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (W - w) / 2, y, size, font, color });
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Heading band shared by every inner page. Returns the y where content can start. */
function startPage(k: Kit, heading: string, instruction?: string, nameLine = false) {
  const page = k.doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 14, width: W, height: 14, color: k.accent });
  page.drawText(heading, { x: M, y: H - 70, size: 24, font: k.bold, color: NAVY });
  let y = H - 70;
  if (instruction) {
    y -= 24;
    page.drawText(instruction, { x: M, y, size: 13, font: k.regular, color: GREY });
  }
  if (nameLine) {
    y -= 30;
    page.drawText("Name:", { x: M, y, size: 11, font: k.bold, color: GREY });
    page.drawLine({ start: { x: M + 40, y: y - 2 }, end: { x: M + 250, y: y - 2 }, thickness: 1, color: LINE });
    page.drawText("Date:", { x: M + 280, y, size: 11, font: k.bold, color: GREY });
    page.drawLine({ start: { x: M + 315, y: y - 2 }, end: { x: W - M, y: y - 2 }, thickness: 1, color: LINE });
  }
  return { page, top: y - 30 };
}

export function finishDocument(k: Kit) {
  const year = new Date().getFullYear();
  const pages = k.doc.getPages();
  pages.forEach((page, i) => {
    if (i === 0) return;
    const note = `(c) ${year} ${k.storeName}  ·  For personal and classroom use`;
    page.drawText(note, { x: M, y: 24, size: 8, font: k.regular, color: GREY });
    const label = `${i + 1} / ${pages.length}`;
    page.drawText(label, { x: W - M - k.regular.widthOfTextAtSize(label, 9), y: 24, size: 9, font: k.regular, color: GREY });
  });
  return k.doc.save();
}

// ---------------------------------------------------------------- shapes
// Outline drawings on a 400×400 canvas, y pointing down (SVG convention).

type Shape = { paths: string[]; circles?: [number, number, number][] };

const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

export const SHAPES: Record<string, Shape> = {
  star: { paths: ["M200 30 L245 150 L372 152 L270 228 L308 352 L200 278 L92 352 L130 228 L28 152 L155 150 Z"] },
  heart: {
    paths: ["M200 355 C 70 265 25 190 60 120 C 95 55 170 60 200 125 C 230 60 305 55 340 120 C 375 190 330 265 200 355 Z"],
  },
  house: {
    paths: [
      "M60 200 L200 70 L340 200 Z",
      "M85 200 L85 360 L315 360 L315 200",
      "M170 360 L170 270 L230 270 L230 360",
      "M105 225 L150 225 L150 265 L105 265 Z",
      "M250 225 L295 225 L295 265 L250 265 Z",
      "M265 120 L265 75 L300 75 L300 152",
    ],
  },
  fish: {
    paths: [
      "M60 200 C 120 95 265 95 320 200 C 265 305 120 305 60 200 Z",
      "M320 200 L385 140 L385 260 Z",
      "M200 125 C 215 160 215 240 200 275",
      circle(115, 185, 12),
    ],
  },
  balloon: {
    paths: [
      "M200 40 C 290 40 332 115 320 180 C 305 255 240 300 200 300 C 160 300 95 255 80 180 C 68 115 110 40 200 40 Z",
      "M188 300 L212 300 L200 316 Z",
      "M200 316 C 175 340 225 360 200 392",
    ],
  },
  tree: {
    paths: [
      "M178 385 L178 262 L222 262 L222 385",
      "M200 55 C 290 55 335 115 322 168 C 365 198 345 268 282 268 L118 268 C 55 268 35 198 78 168 C 65 115 110 55 200 55 Z",
    ],
  },
  sun: {
    paths: [
      circle(200, 200, 75),
      "M200 25 L200 90 M200 310 L200 375 M25 200 L90 200 M310 200 L375 200",
      "M76 76 L122 122 M278 278 L324 324 M76 324 L122 278 M278 122 L324 76",
      "M165 185 L175 185 M225 185 L235 185 M165 225 C 185 250 215 250 235 225",
    ],
  },
  flower: {
    paths: [
      circle(200, 140, 45),
      circle(255, 180, 45),
      circle(235, 245, 45),
      circle(165, 245, 45),
      circle(145, 180, 45),
      circle(200, 195, 32),
      "M200 290 C 195 330 200 360 200 395",
      "M200 345 C 240 320 270 330 280 345 C 255 365 225 362 200 345 Z",
    ],
  },
  cloud: {
    paths: [
      "M95 285 C 35 285 35 205 95 198 C 95 130 190 118 212 172 C 245 118 335 140 322 205 C 382 210 382 285 322 285 Z",
      "M150 330 L140 360 M200 330 L190 360 M250 330 L240 360",
    ],
  },
  rocket: {
    paths: [
      "M200 35 C 262 95 272 200 252 292 L148 292 C 128 200 138 95 200 35 Z",
      circle(200, 140, 26),
      "M150 225 L98 318 L158 292 Z",
      "M250 225 L302 318 L242 292 Z",
      "M170 292 L200 370 L230 292",
    ],
  },
  car: {
    paths: [
      "M45 285 L45 220 L108 208 L150 148 L272 148 L320 208 L358 220 L358 285 Z",
      "M162 162 L150 208 L205 208 L205 162 Z M222 162 L222 208 L298 208 L262 162 Z",
      circle(125, 288, 32),
      circle(282, 288, 32),
    ],
  },
  butterfly: {
    paths: [
      "M200 120 C 210 160 210 260 200 305 C 190 260 190 160 200 120 Z",
      "M195 175 C 130 60 35 95 62 180 C 82 235 160 225 195 200 Z",
      "M205 175 C 270 60 365 95 338 180 C 318 235 240 225 205 200 Z",
      "M195 215 C 140 230 100 300 148 322 C 178 334 195 280 195 245 Z",
      "M205 215 C 260 230 300 300 252 322 C 222 334 205 280 205 245 Z",
      "M198 122 C 185 95 170 85 160 80 M202 122 C 215 95 230 85 240 80",
    ],
  },
  whale: {
    paths: [
      "M40 232 C 40 140 165 108 262 140 C 322 160 342 200 342 232 C 342 302 222 322 150 312 C 90 302 40 282 40 232 Z",
      "M342 212 L392 162 L382 232 L396 292 L342 252",
      "M120 75 C 115 100 125 115 135 128 M150 70 C 150 100 140 115 135 128",
      circle(110, 210, 10),
      "M70 255 C 120 280 200 285 260 268",
    ],
  },
  jellyfish: {
    paths: [
      "M95 205 C 95 85 305 85 305 205 C 270 220 130 220 95 205 Z",
      "M125 215 C 110 265 145 300 120 355 M165 220 C 150 270 185 310 160 370",
      "M205 220 C 190 270 225 310 200 375 M245 220 C 230 270 265 310 240 370 M280 215 C 265 265 300 300 275 355",
      circle(165, 165, 9),
      circle(235, 165, 9),
    ],
  },
  moon: {
    paths: [
      "M265 55 C 160 70 98 150 108 232 C 120 325 212 372 305 340 C 222 330 170 262 180 190 C 190 120 230 80 265 55 Z",
      circle(300, 110, 10),
      circle(330, 210, 7),
      circle(275, 260, 6),
    ],
  },
  planet: {
    paths: [circle(200, 200, 95), "M50 245 C 10 290 380 175 352 150 C 340 138 315 140 293 146", "M107 238 C 90 245 70 250 58 247"],
  },
  snail: {
    paths: [
      "M60 330 L330 330 C 355 330 360 300 340 290 L300 270",
      circle(200, 230, 95),
      "M200 230 C 200 205 235 205 235 230 C 235 270 175 270 172 230 C 168 180 255 175 262 230 C 268 290 158 300 145 230",
      "M318 285 C 330 240 340 210 335 180 M335 180 L345 150 M330 185 L310 155",
    ],
  },
};

function drawShape(page: PDFPage, shape: Shape, x: number, yTop: number, size: number, color = NAVY, width = 3.5, fill?: RGB) {
  const scale = size / 400;
  for (const p of shape.paths) {
    page.drawSvgPath(p, {
      x,
      y: yTop,
      scale,
      borderColor: color,
      borderWidth: width,
      borderLineCap: LineCapStyle.Round,
      ...(fill ? { color: fill } : {}),
    });
  }
}

// ---------------------------------------------------------------- pages

export function cover(k: Kit, opts: { subtitle: string; ageLabel: string; category: string; pagesNote?: string }) {
  const page = k.doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: k.tint });
  page.drawRectangle({ x: 0, y: H * 0.42, width: W, height: H * 0.58, color: k.accent });
  // confetti
  for (let i = 0; i < 26; i++) {
    const c = PALETTE[i % PALETTE.length];
    page.drawCircle({ x: k.rand() * W, y: H * 0.45 + k.rand() * H * 0.53, size: 4 + k.rand() * 10, color: c, opacity: 0.55 });
  }
  page.drawText(opts.category.toUpperCase(), { x: M, y: H - 90, size: 13, font: k.bold, color: k.onAccent });
  const lines = wrap(k.bold, k.title, 44, W - M * 2);
  let y = H - 160;
  for (const line of lines) {
    page.drawText(line, { x: M, y, size: 44, font: k.bold, color: k.onAccent });
    y -= 52;
  }
  const sub = wrap(k.regular, opts.subtitle, 16, W - M * 2);
  y -= 8;
  for (const line of sub) {
    page.drawText(line, { x: M, y, size: 16, font: k.regular, color: k.onAccent });
    y -= 22;
  }
  // big friendly star sticker
  page.drawCircle({ x: W / 2, y: H * 0.42, size: 92, color: WHITE });
  drawShape(page, SHAPES.star, W / 2 - 70, H * 0.42 + 70, 140, k.ink, 4, hex("#FFD95A"));
  centerText(page, opts.ageLabel, H * 0.24, k.bold, 26);
  if (opts.pagesNote) centerText(page, opts.pagesNote, H * 0.24 - 30, k.regular, 14, GREY);
  centerText(page, k.storeName, 60, k.bold, 18, k.ink);
}

type Scene = "sky" | "garden" | "night" | "sea";

function drawScene(k: Kit, page: PDFPage, scene: Scene, yBottom: number, height: number) {
  const x = M;
  const w = W - M * 2;
  const skyColor = scene === "night" ? hex("#2E2A6B") : scene === "sea" ? hex("#BFE3FF") : hex("#DDF0FF");
  page.drawRectangle({ x, y: yBottom, width: w, height, color: skyColor });
  if (scene === "night") {
    page.drawCircle({ x: x + w - 90, y: yBottom + height - 80, size: 42, color: hex("#FFF3B0") });
    page.drawCircle({ x: x + w - 72, y: yBottom + height - 70, size: 38, color: skyColor });
    for (let i = 0; i < 18; i++) {
      page.drawCircle({ x: x + 20 + k.rand() * (w - 40), y: yBottom + 60 + k.rand() * (height - 80), size: 1.5 + k.rand() * 2.5, color: WHITE });
    }
    page.drawRectangle({ x, y: yBottom, width: w, height: 50, color: hex("#1F3B2D") });
    return;
  }
  if (scene === "sea") {
    page.drawRectangle({ x, y: yBottom, width: w, height: height * 0.62, color: hex("#4DA3FF") });
    for (let i = 0; i < 4; i++) {
      drawShape(page, SHAPES.fish, x + 40 + i * 120, yBottom + 40 + (i % 2) * 70 + 90, 90, NAVY, 2, PALETTE[(i + 2) % 5]);
    }
    page.drawCircle({ x: x + w - 70, y: yBottom + height - 55, size: 30, color: hex("#FFD95A") });
    return;
  }
  // sky + garden share hills and a sun
  page.drawCircle({ x: x + w - 80, y: yBottom + height - 70, size: 38, color: hex("#FFD95A") });
  drawShape(page, SHAPES.cloud, x + 30, yBottom + height - 20, 150, WHITE, 1, WHITE);
  if (scene === "sky") drawShape(page, SHAPES.cloud, x + 210, yBottom + height - 40, 110, WHITE, 1, WHITE);
  page.drawEllipse({ x: x + w * 0.25, y: yBottom, xScale: w * 0.45, yScale: 70, color: hex("#72D6B1") });
  page.drawEllipse({ x: x + w * 0.8, y: yBottom, xScale: w * 0.4, yScale: 55, color: hex("#5CC49E") });
  // trim hills and clouds that spill outside the scene box
  page.drawRectangle({ x: 0, y: yBottom - 80, width: W, height: 80, color: WHITE });
  page.drawRectangle({ x: 0, y: yBottom - 80, width: x, height: height + 80, color: WHITE });
  page.drawRectangle({ x: x + w, y: yBottom - 80, width: W - x - w, height: height + 80, color: WHITE });
  if (scene === "garden") {
    for (let i = 0; i < 5; i++) {
      drawShape(page, SHAPES.flower, x + 30 + i * 95, yBottom + 120, 80, NAVY, 1.5, PALETTE[i % 5]);
    }
  }
}

export function storyPage(k: Kit, text: string, scene: Scene, heading?: string) {
  const page = k.doc.addPage([W, H]);
  const sceneHeight = 380;
  drawScene(k, page, scene, H - M - sceneHeight, sceneHeight);
  let y = H - M - sceneHeight - 60;
  if (heading) {
    page.drawText(heading, { x: M, y, size: 22, font: k.bold, color: k.ink });
    y -= 40;
  }
  for (const line of wrap(k.regular, text, 20, W - M * 2)) {
    page.drawText(line, { x: M, y, size: 20, font: k.regular, color: NAVY });
    y -= 30;
  }
}

export function titlePage(k: Kit, title: string, subtitle?: string) {
  const page = k.doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: k.tint });
  drawShape(page, SHAPES.moon, W / 2 - 90, H / 2 + 260, 180, k.ink, 3, hex("#FFF3B0"));
  centerText(page, title, H / 2 - 20, k.bold, 30);
  if (subtitle) centerText(page, subtitle, H / 2 - 56, k.regular, 15, GREY);
}

export function countingPage(k: Kit, n: number, things: string, shape: string) {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const page = k.doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: H - 14, width: W, height: 14, color: k.accent });
  centerText(page, String(n), H - 230, k.bold, 160, k.ink);
  centerText(page, words[n].toUpperCase(), H - 280, k.bold, 28);
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const size = n <= 4 ? 110 : 80;
  const gap = 18;
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const inRow = Math.min(perRow, n - row * perRow);
    const rowWidth = inRow * size + (inRow - 1) * gap;
    const x = (W - rowWidth) / 2 + col * (size + gap);
    const yTop = H - 330 - row * (size + gap);
    drawShape(page, SHAPES[shape], x, yTop, size, NAVY, 2, PALETTE[i % 5]);
  }
  centerText(page, `Ollie counts ${n} ${things}!`, 150, k.bold, 24);
  centerText(page, "Point and count them with your finger.", 118, k.regular, 15, GREY);
}

export function factPage(k: Kit, name: string, fact: string, color: string, ringed = false, size = 150) {
  const { page, top } = startPage(k, name);
  const cx = W / 2;
  const cy = top - 200;
  page.drawCircle({ x: cx, y: cy, size, color: hex(color) });
  if (ringed) page.drawEllipse({ x: cx, y: cy, xScale: size * 1.7, yScale: size * 0.35, borderColor: hex("#C9A86A"), borderWidth: 10 });
  let y = cy - size - 70;
  for (const line of wrap(k.regular, fact, 18, W - M * 2)) {
    page.drawText(line, { x: M, y, size: 18, font: k.regular, color: NAVY });
    y -= 28;
  }
}

export function colouringPage(k: Kit, shapeName: string, label: string) {
  const { page, top } = startPage(k, `Colour the ${label}!`, "Use any colours you like. Stay inside the lines if you can!", true);
  const size = 440;
  drawShape(page, SHAPES[shapeName], (W - size) / 2, top - 10, size, NAVY, 4);
  for (let i = 0; i < 4; i++) {
    const s = 46;
    const x = i % 2 === 0 ? M : W - M - s;
    const y = i < 2 ? top - 10 : top - size + 40;
    drawShape(page, SHAPES.star, x, y, s, NAVY, 2);
  }
}

export function mazePage(k: Kit, cols: number, rows: number, title = "Find the way out!") {
  const { page, top } = startPage(k, title, "Start at the green dot and find a path to the red dot.", true);
  const walls = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ n: true, s: true, e: true, w: true })));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack: [number, number][] = [[0, 0]];
  seen[0][0] = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const options = (
      [
        [r - 1, c, "n", "s"],
        [r + 1, c, "s", "n"],
        [r, c + 1, "e", "w"],
        [r, c - 1, "w", "e"],
      ] as const
    ).filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc]);
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [nr, nc, d, back] = options[Math.floor(k.rand() * options.length)];
    walls[r][c][d] = false;
    walls[nr][nc][back] = false;
    seen[nr][nc] = true;
    stack.push([nr, nc]);
  }
  walls[0][0].n = false;
  walls[rows - 1][cols - 1].s = false;

  const size = Math.min((W - M * 2) / cols, (top - 90) / rows);
  const ox = (W - size * cols) / 2;
  const oy = top - 10; // top edge
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 2.5, color: NAVY, lineCap: LineCapStyle.Round });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * size;
      const y = oy - r * size;
      const cell = walls[r][c];
      if (cell.n) line(x, y, x + size, y);
      if (cell.w) line(x, y, x, y - size);
      if (r === rows - 1 && cell.s) line(x, y - size, x + size, y - size);
      if (c === cols - 1 && cell.e) line(x + size, y, x + size, y - size);
    }
  }
  page.drawCircle({ x: ox + size / 2, y: oy + 14, size: 8, color: hex("#2EB67D") });
  page.drawCircle({ x: ox + size * (cols - 0.5), y: oy - size * rows - 14, size: 8, color: hex("#FF5A4E") });
}

export function wordSearchPage(k: Kit, theme: string, words: string[], n = 10) {
  const { page, top } = startPage(k, `Word search: ${theme}`, "Find and circle each word. Words go across, down or diagonally.", true);
  const grid: string[][] = Array.from({ length: n }, () => Array(n).fill(""));
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
  ];
  const placed: string[] = [];
  for (const word of words) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const [dr, dc] = dirs[Math.floor(k.rand() * dirs.length)];
      const r0 = int(k, 0, n - 1 - dr * (word.length - 1));
      const c0 = int(k, 0, n - 1 - dc * (word.length - 1));
      if (r0 < 0 || c0 < 0) continue;
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const ch = grid[r0 + dr * i][c0 + dc * i];
        if (ch && ch !== word[i]) ok = false;
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[r0 + dr * i][c0 + dc * i] = word[i];
      placed.push(word);
      break;
    }
  }
  const letters = "ABCDEFGHIJKLMNOPRSTUVWY";
  const cell = Math.min(40, (W - M * 2) / n);
  const ox = (W - cell * n) / 2;
  const oy = top - 10;
  page.drawRectangle({ x: ox - 8, y: oy - cell * n - 8, width: cell * n + 16, height: cell * n + 16, borderColor: k.ink, borderWidth: 2 });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const ch = grid[r][c] || letters[Math.floor(k.rand() * letters.length)];
      const w = k.bold.widthOfTextAtSize(ch, 20);
      page.drawText(ch, { x: ox + c * cell + (cell - w) / 2, y: oy - (r + 1) * cell + cell * 0.3, size: 20, font: k.bold, color: NAVY });
    }
  }
  let y = oy - cell * n - 50;
  page.drawText("Words to find:", { x: M, y, size: 14, font: k.bold, color: NAVY });
  y -= 26;
  placed.forEach((word, i) => {
    const x = M + (i % 4) * 125;
    const yy = y - Math.floor(i / 4) * 26;
    page.drawRectangle({ x, y: yy - 3, width: 12, height: 12, borderColor: GREY, borderWidth: 1 });
    page.drawText(word, { x: x + 20, y: yy, size: 13, font: k.regular, color: NAVY });
  });
}

const DOT_SHAPES: Record<string, () => [number, number][]> = {
  star: () =>
    Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? 1 : 0.42;
      return [0.5 + 0.48 * r * Math.cos(a), 0.52 + 0.48 * r * Math.sin(a)];
    }),
  heart: () =>
    Array.from({ length: 18 }, (_, i) => {
      const t = Math.PI - (i * 2 * Math.PI) / 18;
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [0.5 + x / 36, 0.45 - y / 36];
    }),
  house: () => [
    [0.12, 0.45],
    [0.5, 0.08],
    [0.88, 0.45],
    [0.78, 0.45],
    [0.78, 0.92],
    [0.58, 0.92],
    [0.58, 0.68],
    [0.42, 0.68],
    [0.42, 0.92],
    [0.22, 0.92],
    [0.22, 0.45],
  ],
  fish: () => [
    [0.08, 0.5],
    [0.2, 0.32],
    [0.38, 0.24],
    [0.56, 0.28],
    [0.7, 0.4],
    [0.92, 0.22],
    [0.85, 0.5],
    [0.92, 0.78],
    [0.7, 0.6],
    [0.56, 0.72],
    [0.38, 0.76],
    [0.2, 0.68],
  ],
  rocket: () => [
    [0.5, 0.04],
    [0.62, 0.2],
    [0.66, 0.45],
    [0.64, 0.66],
    [0.82, 0.86],
    [0.62, 0.8],
    [0.56, 0.96],
    [0.44, 0.96],
    [0.38, 0.8],
    [0.18, 0.86],
    [0.36, 0.66],
    [0.34, 0.45],
    [0.38, 0.2],
  ],
  diamond: () => [
    [0.5, 0.06],
    [0.72, 0.28],
    [0.92, 0.5],
    [0.72, 0.72],
    [0.5, 0.94],
    [0.28, 0.72],
    [0.08, 0.5],
    [0.28, 0.28],
  ],
};

export const DOT_SHAPE_NAMES = Object.keys(DOT_SHAPES);

export function dotsPage(k: Kit, shape: string) {
  const pts = DOT_SHAPES[shape]();
  const { page, top } = startPage(k, "Join the dots!", `Draw a line from 1 to ${pts.length}, then back to 1. What did you make?`, true);
  const size = 440;
  const ox = (W - size) / 2;
  const oy = top - 20;
  pts.forEach(([px, py], i) => {
    const x = ox + px * size;
    const y = oy - py * size;
    page.drawCircle({ x, y, size: 4.5, color: NAVY });
    page.drawText(String(i + 1), { x: x + 7, y: y + 6, size: 14, font: k.bold, color: k.ink });
  });
  page.drawText("Now colour it in!", { x: M, y: oy - size - 50, size: 16, font: k.bold, color: GREY });
}

const MATCH_SHAPES = ["star", "heart", "fish", "balloon", "sun", "car", "tree", "rocket"];

export function matchPage(k: Kit) {
  const { page, top } = startPage(k, "Match the pictures", "Draw a line from each picture to the one that looks the same.", true);
  const picks = shuffle(k, MATCH_SHAPES).slice(0, 5);
  const right = shuffle(k, picks);
  const size = 92;
  const rowH = (top - 80) / 5;
  picks.forEach((name, i) => {
    const y = top - i * rowH;
    drawShape(page, SHAPES[name], M + 20, y, size, NAVY, 2.5, PALETTE[i % 5]);
    page.drawCircle({ x: M + 140, y: y - size / 2, size: 6, color: NAVY });
  });
  right.forEach((name, i) => {
    const y = top - i * rowH;
    drawShape(page, SHAPES[name], W - M - 20 - size, y, size, NAVY, 2.5);
    page.drawCircle({ x: W - M - 140, y: y - size / 2, size: 6, color: NAVY });
  });
}

export function howManyPage(k: Kit) {
  const { page, top } = startPage(k, "How many?", "Count the pictures in each row and write the number in the box.", true);
  const rows = 5;
  const rowH = (top - 80) / rows;
  const names = shuffle(k, ["star", "heart", "balloon", "fish", "flower", "sun"]);
  for (let r = 0; r < rows; r++) {
    const count = int(k, 1, 6);
    k.answers.push(`How many (row ${r + 1}): ${count}`);
    const y = top - r * rowH;
    for (let i = 0; i < count; i++) drawShape(page, SHAPES[names[r % names.length]], M + i * 62, y - 5, 56, NAVY, 2);
    page.drawRectangle({ x: W - M - 70, y: y - 66, width: 66, height: 60, borderColor: k.ink, borderWidth: 3 });
  }
}

export function shapesPage(k: Kit) {
  const { page, top } = startPage(k, "Trace and colour the shapes", "Trace the dotted lines, then colour each shape.", true);
  const cellW = (W - M * 2) / 3;
  const items: { label: string; draw: (x: number, y: number) => void }[] = [
    { label: "circle", draw: (x, y) => page.drawCircle({ x: x + 70, y: y - 70, size: 62, borderColor: GREY, borderWidth: 3, borderDashArray: [6, 6] }) },
    { label: "square", draw: (x, y) => page.drawRectangle({ x: x + 10, y: y - 135, width: 125, height: 125, borderColor: GREY, borderWidth: 3, borderDashArray: [6, 6] }) },
    { label: "triangle", draw: (x, y) => page.drawSvgPath("M70 0 L140 130 L0 130 Z", { x: x + 2, y: y - 5, borderColor: GREY, borderWidth: 3, borderDashArray: [6, 6] }) },
    { label: "rectangle", draw: (x, y) => page.drawRectangle({ x: x, y: y - 110, width: 150, height: 85, borderColor: GREY, borderWidth: 3, borderDashArray: [6, 6] }) },
    { label: "star", draw: (x, y) => page.drawSvgPath(SHAPES.star.paths[0], { x, y, scale: 0.36, borderColor: GREY, borderWidth: 3, borderDashArray: [6, 6] }) },
    { label: "heart", draw: (x, y) => page.drawSvgPath(SHAPES.heart.paths[0], { x, y, scale: 0.36, borderColor: GREY, borderWidth: 3, borderDashArray: [6, 6] }) },
  ];
  items.forEach((item, i) => {
    const x = M + (i % 3) * cellW + 12;
    const y = top - Math.floor(i / 3) * 280;
    item.draw(x, y);
    page.drawText(item.label, { x: x + 40, y: y - 175, size: 16, font: k.bold, color: NAVY });
  });
}

export function mathPage(k: Kit, op: "+" | "-" | "mix", max: number, title?: string) {
  const { page, top } = startPage(k, title ?? (op === "+" ? "Addition practice" : op === "-" ? "Subtraction practice" : "Add and subtract"), "Solve each sum. Show your working if you need to!", true);
  const rowH = (top - 70) / 10;
  const answers: string[] = [];
  for (let i = 0; i < 20; i++) {
    const useMinus = op === "-" || (op === "mix" && k.rand() < 0.5);
    let a = int(k, 1, max);
    let b = int(k, 1, max);
    if (useMinus && b > a) [a, b] = [b, a];
    if (!useMinus && a + b > max * 1.5) b = Math.max(1, Math.floor(b / 2));
    const res = useMinus ? a - b : a + b;
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * ((W - M * 2) / 2);
    const y = top - row * rowH - 20;
    page.drawText(`${i + 1}.`, { x, y, size: 13, font: k.regular, color: GREY });
    page.drawText(`${a} ${useMinus ? "-" : "+"} ${b} =`, { x: x + 34, y, size: 20, font: k.bold, color: NAVY });
    page.drawLine({ start: { x: x + 150, y: y - 3 }, end: { x: x + 220, y: y - 3 }, thickness: 1.2, color: GREY });
    answers.push(`${i + 1}) ${res}`);
  }
  k.answers.push(`${title ?? "Maths"}: ${answers.join("  ")}`);
}

export function tablesPage(k: Kit, n: number) {
  const { page, top } = startPage(k, `The ${n} times table`, "Fill in the answers. Then say them out loud!", true);
  for (let i = 1; i <= 10; i++) {
    const y = top - (i - 1) * 42 - 20;
    page.drawText(`${n}  x  ${i}  =`, { x: M + 30, y, size: 22, font: k.bold, color: NAVY });
    page.drawLine({ start: { x: M + 175, y: y - 3 }, end: { x: M + 255, y: y - 3 }, thickness: 1.2, color: GREY });
  }
  const mixed = shuffle(k, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 6);
  page.drawRectangle({ x: W / 2 + 30, y: top - 300, width: W / 2 - M - 30, height: 290, color: k.tint });
  page.drawText("Quick quiz", { x: W / 2 + 50, y: top - 40, size: 16, font: k.bold, color: NAVY });
  mixed.forEach((m, i) => {
    page.drawText(`${m} x ${n} = ____`, { x: W / 2 + 50, y: top - 80 - i * 36, size: 16, font: k.regular, color: NAVY });
  });
  k.answers.push(`${n}x table quiz: ${mixed.map((m) => `${m}x${n}=${m * n}`).join("  ")}`);
}

function guideLines(page: PDFPage, y: number, height: number) {
  page.drawLine({ start: { x: M, y: y + height }, end: { x: W - M, y: y + height }, thickness: 1, color: LINE });
  page.drawLine({ start: { x: M, y: y + height / 2 }, end: { x: W - M, y: y + height / 2 }, thickness: 1, color: LINE, dashArray: [5, 5] });
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.5, color: GREY });
}

export function tracingPage(k: Kit, chars: string[], heading?: string) {
  const { page, top } = startPage(k, heading ?? `Let's trace: ${chars.join("  ")}`, "Trace the grey letters, then try writing your own on the last line.", true);
  const rowH = 92;
  let y = top - 70;
  for (const ch of chars) {
    const big = 64;
    for (let rep = 0; rep < 2; rep++) {
      guideLines(page, y, 50);
      // First row: one dark example then grey copies to trace. Second row:
      // a few to trace, then open space to write freely.
      const step = k.bold.widthOfTextAtSize(ch, big) + 28;
      const fit = Math.floor((W - M * 2 - 6) / step);
      const count = rep === 0 ? fit : Math.max(1, Math.floor(fit / 2));
      for (let i = 0, x = M + 6; i < count; i++, x += step) {
        page.drawText(ch, { x, y: y + 1, size: big, font: k.bold, color: rep === 0 && i === 0 ? NAVY : TRACE });
      }
      y -= rowH;
    }
  }
}

export function numberTracingPage(k: Kit, nums: number[]) {
  const { page, top } = startPage(k, `Trace the numbers ${nums[0]}-${nums[nums.length - 1]}`, "Trace each number, then colour the same number of circles.", true);
  const rowH = (top - 70) / nums.length;
  nums.forEach((n, i) => {
    const y = top - (i + 1) * rowH + 20;
    let x = M;
    for (let j = 0; j < 3; j++) {
      page.drawText(String(n), { x, y, size: 56, font: k.bold, color: j === 0 ? NAVY : TRACE });
      x += k.bold.widthOfTextAtSize(String(n), 56) + 22;
    }
    for (let d = 0; d < n; d++) {
      page.drawCircle({ x: W / 2 + 10 + (d % 5) * 36, y: y + 32 - Math.floor(d / 5) * 34, size: 13, borderColor: k.ink, borderWidth: 2 });
    }
  });
}

export function questionsPage(k: Kit, heading: string, instruction: string, qa: [string, string][]) {
  const { page, top } = startPage(k, heading, instruction, true);
  let y = top - 10;
  qa.forEach(([q], i) => {
    const lines = wrap(k.regular, `${i + 1}. ${q}`, 15, W - M * 2);
    for (const line of lines) {
      page.drawText(line, { x: M, y, size: 15, font: k.regular, color: NAVY });
      y -= 21;
    }
    page.drawLine({ start: { x: M + 18, y: y - 4 }, end: { x: W - M, y: y - 4 }, thickness: 1, color: LINE });
    y -= 36;
  });
  k.answers.push(`${heading}: ${qa.map(([, a], i) => `${i + 1}) ${a}`).join("  ")}`);
}

export function missingLettersPage(k: Kit, words: [string, string][]) {
  const { page, top } = startPage(k, "Fill in the missing letter", "Read the clue and write the missing letter in the box.", true);
  let y = top - 20;
  const answers: string[] = [];
  words.forEach(([word, clue], i) => {
    const hide = int(k, 0, word.length - 1);
    let x = M;
    for (let c = 0; c < word.length; c++) {
      page.drawRectangle({ x, y: y - 8, width: 38, height: 42, borderColor: c === hide ? k.ink : LINE, borderWidth: c === hide ? 2.5 : 1 });
      if (c !== hide) page.drawText(word[c], { x: x + 11, y, size: 24, font: k.bold, color: NAVY });
      x += 44;
    }
    page.drawText(clue, { x: M + 230, y: y + 6, size: 14, font: k.regular, color: GREY });
    answers.push(`${i + 1}) ${word}`);
    y -= 66;
  });
  k.answers.push(`Missing letters: ${answers.join("  ")}`);
}

function sudoku(k: Kit, n: number, boxW: number, boxH: number) {
  const base = (r: number, c: number) => (boxW * (r % boxH) + Math.floor(r / boxH) + c) % n;
  const bands = shuffle(k, [...Array(n / boxH).keys()]);
  const rows = bands.flatMap((b) => shuffle(k, [...Array(boxH).keys()]).map((r) => b * boxH + r));
  const stacks = shuffle(k, [...Array(n / boxW).keys()]);
  const cols = stacks.flatMap((s) => shuffle(k, [...Array(boxW).keys()]).map((c) => s * boxW + c));
  const digits = shuffle(k, [...Array(n).keys()].map((d) => d + 1));
  const solution = rows.map((r) => cols.map((c) => digits[base(r, c)]));
  const puzzle = solution.map((row) => row.map((v) => (k.rand() < 0.45 ? 0 : v)));
  return { solution, puzzle };
}

export function sudokuPage(k: Kit, n: 4 | 6) {
  const { page, top } = startPage(k, n === 4 ? "Mini sudoku" : "Sudoku challenge", `Fill the grid so every row, column and box has the numbers 1 to ${n}.`, true);
  const boxW = n === 4 ? 2 : 3;
  const boxH = 2;
  const count = n === 4 ? 2 : 1;
  const cell = n === 4 ? 56 : 64;
  for (let p = 0; p < count; p++) {
    const { solution, puzzle } = sudoku(k, n, boxW, boxH);
    const ox = (W - cell * n) / 2;
    const oy = top - 20 - p * (cell * n + 70);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = ox + c * cell;
        const y = oy - (r + 1) * cell;
        page.drawRectangle({ x, y, width: cell, height: cell, borderColor: GREY, borderWidth: 0.8 });
        if (puzzle[r][c]) {
          const t = String(puzzle[r][c]);
          page.drawText(t, { x: x + (cell - k.bold.widthOfTextAtSize(t, 26)) / 2, y: y + cell * 0.32, size: 26, font: k.bold, color: NAVY });
        }
      }
    }
    for (let r = 0; r <= n; r += boxH) {
      page.drawLine({ start: { x: ox, y: oy - r * cell }, end: { x: ox + n * cell, y: oy - r * cell }, thickness: 3, color: NAVY });
    }
    for (let c = 0; c <= n; c += boxW) {
      page.drawLine({ start: { x: ox + c * cell, y: oy }, end: { x: ox + c * cell, y: oy - n * cell }, thickness: 3, color: NAVY });
    }
    k.answers.push(`Sudoku ${n}x${n}: ${solution.map((row) => row.join("")).join(" / ")}`);
  }
}

export function patternsPage(k: Kit) {
  const { page, top } = startPage(k, "What comes next?", "Find the rule and write the next number.", true);
  const answers: string[] = [];
  for (let i = 0; i < 8; i++) {
    const kind = i % 4;
    let seq: number[];
    if (kind === 0) {
      const s = int(k, 1, 9);
      const d = int(k, 2, 5);
      seq = [0, 1, 2, 3, 4].map((j) => s + d * j);
    } else if (kind === 1) {
      const s = int(k, 1, 3);
      seq = [0, 1, 2, 3, 4].map((j) => s * 2 ** j);
    } else if (kind === 2) {
      const s = int(k, 40, 60);
      const d = int(k, 3, 6);
      seq = [0, 1, 2, 3, 4].map((j) => s - d * j);
    } else {
      seq = [1, 4, 9, 16, 25];
      if (i > 4) seq = [1, 1, 2, 3, 5];
    }
    const answer = seq.pop()!;
    const y = top - 10 - i * 66;
    page.drawText(`${i + 1}.   ${seq.join(",   ")},`, { x: M, y, size: 20, font: k.bold, color: NAVY });
    page.drawRectangle({ x: M + 330, y: y - 12, width: 70, height: 40, borderColor: k.ink, borderWidth: 2 });
    answers.push(`${i + 1}) ${answer}`);
  }
  k.answers.push(`What comes next: ${answers.join("  ")}`);
}

export function answerKeyPage(k: Kit) {
  if (k.answers.length === 0) return;
  const { page, top } = startPage(k, "Answer key", "For grown-ups: check answers together and celebrate effort!");
  let y = top - 6;
  for (const entry of k.answers) {
    for (const line of wrap(k.regular, entry, 10.5, W - M * 2)) {
      if (y < 60) return;
      page.drawText(line, { x: M, y, size: 10.5, font: k.regular, color: NAVY });
      y -= 15;
    }
    y -= 8;
  }
}

export function certificatePage(k: Kit) {
  const page = k.doc.addPage([W, H]);
  // Bottom edge sits above the shared footer line at y=24.
  page.drawRectangle({ x: 24, y: 44, width: W - 48, height: H - 68, borderColor: k.accent, borderWidth: 6 });
  page.drawRectangle({ x: 38, y: 58, width: W - 76, height: H - 96, borderColor: k.ink, borderWidth: 2 });
  for (let i = 0; i < 3; i++) drawShape(page, SHAPES.star, W / 2 - 150 + i * 105, H - 110, 90, NAVY, 2, PALETTE[i + 1]);
  centerText(page, "Certificate of", H - 290, k.regular, 26, GREY);
  centerText(page, "Awesome Learning", H - 335, k.bold, 40, k.ink);
  centerText(page, "This is to celebrate that", H - 410, k.regular, 16, GREY);
  page.drawLine({ start: { x: 130, y: H - 470 }, end: { x: W - 130, y: H - 470 }, thickness: 1.5, color: NAVY });
  centerText(page, "has finished", H - 510, k.regular, 16, GREY);
  centerText(page, k.title, H - 550, k.bold, 20);
  centerText(page, "Well done, superstar!", H - 620, k.bold, 22, NAVY);
  page.drawLine({ start: { x: 90, y: 150 }, end: { x: 250, y: 150 }, thickness: 1, color: GREY });
  page.drawText("Date", { x: 155, y: 132, size: 11, font: k.regular, color: GREY });
  page.drawLine({ start: { x: W - 250, y: 150 }, end: { x: W - 90, y: 150 }, thickness: 1, color: GREY });
  page.drawText("Grown-up's signature", { x: W - 225, y: 132, size: 11, font: k.regular, color: GREY });
}

export function infoPage(k: Kit, heading: string, paragraphs: string[]) {
  const { page, top } = startPage(k, heading);
  let y = top - 6;
  for (const para of paragraphs) {
    for (const line of wrap(k.regular, para, 14, W - M * 2)) {
      page.drawText(line, { x: M, y, size: 14, font: k.regular, color: NAVY });
      y -= 21;
    }
    y -= 12;
  }
}
