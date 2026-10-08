import "server-only";
import { db } from "./db";
import { FILES_DIR, resolveStored } from "./storage";

export function isReadable(file: string | null | undefined) {
  return Boolean(file?.toLowerCase().endsWith(".pdf"));
}

/**
 * Looks up a download token for online reading. Reading follows the same rules
 * as downloading (paid order, link not expired) but doesn't use up downloads.
 */
export async function findReadableDownload(token: string) {
  const dl = await db.download.findUnique({
    where: { downloadToken: token },
    include: {
      order: { select: { id: true, status: true } },
      product: { select: { title: true, slug: true, file: true, category: true } },
    },
  });
  if (!dl || dl.order.status !== "PAID") return { error: "invalid" as const };
  if (dl.expiresAt < new Date()) return { error: "expired" as const, orderId: dl.orderId };
  if (!isReadable(dl.product.file)) return { error: "not-pdf" as const, orderId: dl.orderId };
  const path = resolveStored(FILES_DIR, dl.product.file!);
  if (!path) return { error: "invalid" as const };
  return { dl, path };
}
