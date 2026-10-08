import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveStored, THUMB_TYPES, THUMBS_DIR } from "@/lib/storage";

// Product thumbnails. Names are random UUIDs (or seed-<slug>), so caching hard is safe.
export async function GET(_req: Request, ctx: RouteContext<"/media/[name]">) {
  const { name } = await ctx.params;
  const file = resolveStored(THUMBS_DIR, name);
  const type = THUMB_TYPES[path.extname(name).toLowerCase()];
  if (!file || !type) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(file);
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        // Admin-uploaded SVGs could carry script; this stops it running if opened directly.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
