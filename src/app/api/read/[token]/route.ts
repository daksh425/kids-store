import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { findReadableDownload } from "@/lib/downloads";

// Streams the PDF to the in-browser book reader. Same token checks as
// /download, but shown inline and not counted against the download limit.
export async function GET(_req: Request, ctx: RouteContext<"/api/read/[token]">) {
  const { token } = await ctx.params;
  const found = await findReadableDownload(token);
  if ("error" in found) return new Response("Not available", { status: found.error === "expired" ? 410 : 404 });

  const size = await stat(found.path).then((s) => s.size).catch(() => null);
  if (size == null) return new Response("File missing", { status: 404 });

  return new Response(Readable.toWeb(createReadStream(found.path)) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(size),
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
    },
  });
}
