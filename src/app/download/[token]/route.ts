import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { trackEvent } from "@/lib/analytics";
import { db } from "@/lib/db";
import { FILE_TYPES, FILES_DIR, resolveStored } from "@/lib/storage";

// The only way a product file leaves the server. The token must belong to a
// PAID order, be unexpired and have downloads left; files never get a public URL.

function back(req: Request, path: string) {
  return Response.redirect(new URL(path, req.url), 303);
}

export async function GET(req: Request, ctx: RouteContext<"/download/[token]">) {
  const { token } = await ctx.params;
  const dl = await db.download.findUnique({
    where: { downloadToken: token },
    include: { order: { select: { status: true } }, product: { select: { file: true, fileName: true, slug: true } } },
  });
  if (!dl || dl.order.status !== "PAID") return back(req, "/orders?download=invalid");

  const orderPage = `/order/${dl.orderId}`;
  const now = new Date();
  if (dl.expiresAt < now) return back(req, `${orderPage}?download=expired`);
  if (dl.downloadCount >= dl.maxDownloads) return back(req, `${orderPage}?download=limit`);

  const filePath = dl.product.file ? resolveStored(FILES_DIR, dl.product.file) : null;
  const size = filePath ? await stat(filePath).then((s) => s.size).catch(() => null) : null;
  if (!filePath || size == null) {
    console.error(`[download] file missing for product ${dl.productId}`);
    return back(req, `${orderPage}?download=missing`);
  }

  // Guarded increment: two simultaneous clicks can't both squeeze past the limit.
  const counted = await db.download.updateMany({
    where: { id: dl.id, downloadCount: { lt: dl.maxDownloads } },
    data: { downloadCount: { increment: 1 }, lastDownloadedAt: now },
  });
  if (counted.count === 0) return back(req, `${orderPage}?download=limit`);

  await db.downloadLog.create({
    data: {
      downloadId: dl.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req.headers.get("user-agent")?.slice(0, 300) || null,
    },
  });
  await trackEvent("download", { productId: dl.productId });

  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  const downloadName = dl.product.fileName || `${dl.product.slug}${ext}`;
  const asciiName = downloadName.replace(/[^\w.\- ]+/g, "_");
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "Content-Type": FILE_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
    },
  });
}
