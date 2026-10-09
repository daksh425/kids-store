import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { db } from "@/lib/db";
import { FILES_DIR, resolveStored } from "@/lib/storage";

// Free preview PDFs (e.g. a first chapter). Public by design: no token needed.
export async function GET(_req: Request, ctx: RouteContext<"/api/sample/[slug]">) {
  const { slug } = await ctx.params;
  const product = await db.product.findFirst({ where: { slug, status: "PUBLISHED" }, select: { sampleFile: true } });
  const file = product?.sampleFile ? resolveStored(FILES_DIR, product.sampleFile) : null;
  const size = file ? await stat(file).then((s) => s.size).catch(() => null) : null;
  if (!file || size == null) return new Response("No sample", { status: 404 });
  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(size),
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=600",
    },
  });
}
