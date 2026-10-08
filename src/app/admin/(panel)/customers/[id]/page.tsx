import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, PageHeader, Panel, StatusBadge, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, inr, orderLabel } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminCustomerDetail({ params }: PageProps<"/admin/customers/[id]">) {
  await requireAdmin();
  const user = await db.user.findUnique({
    where: { id: (await params).id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: { items: { select: { title: true } } } } },
  });
  if (!user) notFound();
  const spent = user.orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.amount, 0);

  return (
    <>
      <PageHeader title={user.name} description={`${user.email}${user.phone ? ` · ${user.phone}` : ""} · customer since ${formatDate(user.createdAt)} · ${inr(spent)} spent`} />
      <Panel title="Order history">
        {user.orders.length ? (
          <Table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {user.orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-bold text-primary hover:underline">
                      {orderLabel(o.number)}
                    </Link>
                  </td>
                  <td className="max-w-md">{o.items.map((i) => i.title).join(", ")}</td>
                  <td className="tabular-nums">{o.amount ? inr(o.amount) : "Free"}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty>No orders.</Empty>
        )}
      </Panel>
    </>
  );
}
