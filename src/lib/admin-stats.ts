import "server-only";
import { db } from "./db";

const DAY = 86_400_000;

/** Calendar day key in India time, e.g. "2026-10-07". */
function istDay(d: Date) {
  return new Date(d.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

export async function dashboardStats() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since14 = new Date(now.getTime() - 13 * DAY);

  const [allTime, last30, products, published, downloads30, customers, recentPaid, events, recentOrders, topItems] = await Promise.all([
    db.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: { _all: true } }),
    db.order.aggregate({ where: { status: "PAID", paidAt: { gte: since30 } }, _sum: { amount: true }, _count: { _all: true } }),
    db.product.count(),
    db.product.count({ where: { status: "PUBLISHED" } }),
    db.downloadLog.count({ where: { createdAt: { gte: since30 } } }),
    db.user.count(),
    db.order.findMany({ where: { status: "PAID", paidAt: { gte: since14 } }, select: { amount: true, paidAt: true } }),
    db.event.groupBy({ by: ["type"], where: { createdAt: { gte: since30 } }, _count: { _all: true } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true, email: true } } } }),
    db.orderItem.groupBy({
      by: ["productId", "title"],
      where: { order: { status: "PAID" } },
      _count: { _all: true },
      _sum: { price: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
  ]);

  // Fill every one of the last 14 days, including ones with no sales.
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 13; i >= 0; i--) byDay.set(istDay(new Date(now.getTime() - i * DAY)), { revenue: 0, orders: 0 });
  for (const o of recentPaid) {
    const slot = o.paidAt ? byDay.get(istDay(o.paidAt)) : undefined;
    if (slot) {
      slot.revenue += o.amount;
      slot.orders += 1;
    }
  }

  const count = (type: string) => events.find((e) => e.type === type)?._count._all ?? 0;
  const funnel = [
    { label: "Product views", value: count("product_view") },
    { label: "Added to cart", value: count("add_to_cart") },
    { label: "Started checkout", value: count("checkout_start") },
    { label: "Paid orders", value: last30._count._all },
    { label: "Downloads", value: downloads30 },
  ];

  return {
    revenueAllTime: allTime._sum.amount ?? 0,
    paidOrdersAllTime: allTime._count._all,
    revenue30: last30._sum.amount ?? 0,
    paidOrders30: last30._count._all,
    products,
    published,
    downloads30,
    customers,
    daily: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    funnel,
    recentOrders,
    topItems: topItems.map((t) => ({ productId: t.productId, title: t.title, sold: t._count._all, revenue: t._sum.price ?? 0 })),
  };
}
