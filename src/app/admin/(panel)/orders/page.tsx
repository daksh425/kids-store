import { Search } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { Empty, PageHeader, Panel, StatusBadge, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime, inr, orderLabel } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

const FILTERS = ["ALL", "PAID", "CREATED", "FAILED"] as const;
const LABELS = { ALL: "All", PAID: "Paid", CREATED: "Pending", FAILED: "Failed" };

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = FILTERS.find((f) => f === sp.status) ?? "ALL";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const where: Prisma.OrderWhereInput = status === "ALL" ? {} : { status };
  if (q) {
    const n = Number(q.replace("#", ""));
    where.OR = [
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { razorpayPaymentId: q },
      { razorpayOrderId: q },
      ...(Number.isInteger(n) && n > 0 ? [{ number: n }] : []),
    ];
  }
  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true } }, _count: { select: { items: true } } },
  });

  return (
    <>
      <PageHeader title="Orders" description="Every checkout, with payment status. Only Paid orders get downloads." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={`/admin/orders${f === "ALL" ? "" : `?status=${f}`}`}
              className={`chip border-2 ${status === f ? "border-primary bg-primary text-white" : "border-line bg-white"}`}
            >
              {LABELS[f]}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {status !== "ALL" ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder="Email, name, #number or payment ID" className="field !w-72 !py-2" />
          <button className="btn btn-outline" aria-label="Search">
            <Search size={16} />
          </button>
        </form>
      </div>
      <Panel>
        {orders.length ? (
          <Table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-bold text-primary hover:underline">
                      {orderLabel(o.number)}
                    </Link>
                  </td>
                  <td>
                    <span className="block font-bold">{o.user.name}</span>
                    <span className="text-xs text-muted">{o.user.email}</span>
                  </td>
                  <td className="tabular-nums">{o._count.items}</td>
                  <td className="whitespace-nowrap tabular-nums">
                    {o.amount ? inr(o.amount) : "Free"}
                    {o.couponCode ? <span className="block text-xs text-muted">{o.couponCode}</span> : null}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-xs text-muted">{o.paymentMethod ?? "-"}</td>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty>No orders match.</Empty>
        )}
      </Panel>
    </>
  );
}
