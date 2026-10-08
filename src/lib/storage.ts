import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

// Product PDFs and thumbnails live outside /public. PDFs are only ever sent by
// the token-checked /download route; thumbnails go through /media.

const ROOT = path.join(process.cwd(), "storage");
export const FILES_DIR = path.join(ROOT, "files");
export const THUMBS_DIR = path.join(ROOT, "thumbnails");

const MAX_FILE_BYTES = 200 * 1024 * 1024;
const MAX_THUMB_BYTES = 5 * 1024 * 1024;

export const THUMB_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export const FILE_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

/** Rejects anything that isn't a bare file name, so a stored name can't walk out of its folder. */
export function resolveStored(dir: string, name: string) {
  if (!name || path.basename(name) !== name || name.startsWith(".")) return null;
  return path.join(dir, name);
}

export async function fileExists(p: string) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function save(file: File, dir: string, types: Record<string, string>, maxBytes: number) {
  const ext = path.extname(file.name).toLowerCase();
  if (!types[ext]) throw new Error(`Unsupported file type ${ext || "(none)"}. Allowed: ${Object.keys(types).join(", ")}`);
  if (file.size > maxBytes) throw new Error(`File is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { name, size: file.size, originalName: file.name };
}

export function saveProductFile(file: File) {
  return save(file, FILES_DIR, FILE_TYPES, MAX_FILE_BYTES);
}

export function saveThumbnail(file: File) {
  return save(file, THUMBS_DIR, THUMB_TYPES, MAX_THUMB_BYTES);
}
