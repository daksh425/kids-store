import { Download, IndianRupee, Package, ReceiptText } from "lucide-react";
import Link from "next/link";
import { Funnel, RevenueChart } from "@/components/admin/charts";
import { Empty, PageHeader, Panel, StatCard, StatusBadge, Table } from "@/components/admin/ui";
import { dashboardStats } from "@/lib/admin-stats";
import { paymentMode } from "@/lib/config";
import { formatDateTime, inr, orderLabel } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminDashboard() {
  await requireAdmin();
  const s = await dashboardStats();
  const mode = paymentMode();

  return (
    <>
      <PageHeader title="Dashboard" description="Sales, orders, products and downloads at a glance." />

      {mode !== "razorpay" ? (
        <p className="mb-5 rounded-2xl border-2 border-dashed border-secondary bg-secondary-50 px-4 py-3 text-sm">
          <strong>Demo payment mode:</strong> Razorpay keys aren&apos;t set, so checkout uses a simulated payment screen. Add{" "}
          <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> (Test Mode) to <code>.env</code> and restart to use real Razorpay.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales (30 days)" value={inr(s.revenue30)} sub={`${inr(s.revenueAllTime)} all time`} icon={IndianRupee} tint="bg-primary-50 text-primary" />
        <StatCard label="Paid orders (30 days)" value={String(s.paidOrders30)} sub={`${s.paidOrdersAllTime} all time · ${s.customers} customers`} icon={ReceiptText} tint="bg-secondary-50 text-[#1F65B8]" />
        <StatCard label="Products" value={String(s.published)} sub={`live of ${s.products} total`} icon={Package} tint="bg-sunny-50 text-[#8A6400]" />
        <StatCard label="Downloads (30 days)" value={String(s.downloads30)} icon={Download} tint="bg-mint-50 text-mint-ink" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Revenue, last 14 days">
          <div className="p-5">
            <RevenueChart data={s.daily} />
          </div>
        </Panel>
        <Panel title="Funnel, last 30 days">
          <div className="p-5">
            <Funnel steps={s.funnel} />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-bold text-primary hover:underline">All orders</Link>}>
          {s.recentOrders.length ? (
            <Table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {s.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-primary hover:underline">
                        {orderLabel(o.number)}
                      </Link>
                    </td>
                    <td className="max-w-48 truncate">{o.user.name}</td>
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
            <Empty>No orders yet. Place a test order from the store to see it here.</Empty>
          )}
        </Panel>
        <Panel title="Top products">
          {s.topItems.length ? (
            <ul className="divide-y divide-line">
              {s.topItems.map((t) => (
                <li key={t.productId} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link href={`/admin/products/${t.productId}`} className="min-w-0 truncate font-bold hover:text-primary">
                    {t.title}
                  </Link>
                  <span className="shrink-0 text-muted tabular-nums">
                    {t.sold} sold · {inr(t.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sales will show up here.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
