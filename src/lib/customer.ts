import "server-only";
import { db } from "./db";
import { getBrowserOrderIds, getCustomerId } from "./session";

/** Who is looking: a signed-in customer (email link) and/or orders placed in this browser. */
export async function getViewer() {
  const [customerId, browserOrderIds] = await Promise.all([getCustomerId(), getBrowserOrderIds()]);
  return { customerId, browserOrderIds };
}

export function canSeeOrder(viewer: Awaited<ReturnType<typeof getViewer>>, order: { id: string; userId: string }) {
  return viewer.customerId === order.userId || viewer.browserOrderIds.includes(order.id);
}

/** A paid order this viewer can see that contains the product, or null. Used to gate reviews. */
export async function findPurchase(productId: string) {
  const viewer = await getViewer();
  if (!viewer.customerId && viewer.browserOrderIds.length === 0) return null;
  const order = await db.order.findFirst({
    where: {
      status: "PAID",
      items: { some: { productId } },
      OR: [
        ...(viewer.customerId ? [{ userId: viewer.customerId }] : []),
        ...(viewer.browserOrderIds.length ? [{ id: { in: viewer.browserOrderIds } }] : []),
      ],
    },
    include: { user: { select: { id: true, name: true } } },
  });
  return order ? order.user : null;
}
