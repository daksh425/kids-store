import Link from "next/link";
import { Empty, PageHeader, Panel, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, inr } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminCustomers() {
  await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { orders: { where: { status: "PAID" }, select: { amount: true, paidAt: true } } },
  });

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has checked out or grabbed a free resource." />
      <Panel>
        {users.length ? (
          <Table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th className="text-right">Paid orders</th>
                <th className="text-right">Spent</th>
                <th>Last order</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const spent = u.orders.reduce((s, o) => s + o.amount, 0);
                const last = u.orders.map((o) => o.paidAt).filter(Boolean).sort((a, b) => b!.getTime() - a!.getTime())[0];
                return (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/customers/${u.id}`} className="block font-bold text-primary hover:underline">
                        {u.name}
                      </Link>
                      <span className="text-xs text-muted">{u.email}</span>
                    </td>
                    <td className="text-muted">{u.phone ?? "-"}</td>
                    <td className="text-right tabular-nums">{u.orders.length}</td>
                    <td className="text-right tabular-nums">{inr(spent)}</td>
                    <td className="whitespace-nowrap text-muted">{last ? formatDate(last) : "-"}</td>
                    <td className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Empty>No customers yet.</Empty>
        )}
      </Panel>
    </>
  );
}
