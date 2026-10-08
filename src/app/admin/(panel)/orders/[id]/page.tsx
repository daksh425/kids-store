import { Mail } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadRows } from "@/components/admin/download-rows";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime, inr, orderLabel } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { resendOrderEmail } from "../../actions";

export default async function AdminOrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const order = await db.order.findUnique({
    where: { id: (await params).id },
    include: {
      user: true,
      items: true,
      downloads: { include: { product: { select: { title: true } }, order: { select: { number: true, id: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Status", <StatusBadge key="s" status={order.status} />],
    ["Created", formatDateTime(order.createdAt)],
    ["Paid", order.paidAt ? formatDateTime(order.paidAt) : "-"],
    ["Payment method", order.paymentMethod ?? "-"],
    ["Razorpay order", order.razorpayOrderId ?? "-"],
    ["Razorpay payment", order.razorpayPaymentId ?? "-"],
    ...(order.failureReason ? ([["Failure reason", order.failureReason]] as [string, string][]) : []),
  ];

  return (
    <>
      <PageHeader
        title={`Order ${orderLabel(order.number)}`}
        actions={
          order.status === "PAID" ? (
            <form action={resendOrderEmail}>
              <input type="hidden" name="id" value={order.id} />
              <button className="btn btn-outline">
                <Mail size={16} /> Resend confirmation email
              </button>
            </form>
          ) : null
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Payment">
          <dl className="divide-y divide-line text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="truncate text-right font-mono text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Customer">
          <div className="space-y-1 p-5 text-sm">
            <Link href={`/admin/customers/${order.user.id}`} className="font-bold text-primary hover:underline">
              {order.user.name}
            </Link>
            <p>{order.user.email}</p>
            {order.user.phone ? <p>{order.user.phone}</p> : null}
          </div>
        </Panel>
      </div>

      <Panel title="Items" className="mt-6">
        <ul className="divide-y divide-line text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between px-5 py-3">
              <Link href={`/admin/products/${i.productId}`} className="font-bold hover:text-primary">
                {i.title}
              </Link>
              <span className="tabular-nums">{i.price ? inr(i.price) : "Free"}</span>
            </li>
          ))}
          <li className="flex justify-between px-5 py-3 text-muted">
            <span>Subtotal</span>
            <span className="tabular-nums">{inr(order.subtotal)}</span>
          </li>
          {order.discount ? (
            <li className="flex justify-between px-5 py-3 text-mint-ink">
              <span>Coupon {order.couponCode}</span>
              <span className="tabular-nums">−{inr(order.discount)}</span>
            </li>
          ) : null}
          <li className="flex justify-between px-5 py-3 font-bold">
            <span>Total</span>
            <span className="tabular-nums">{order.amount ? inr(order.amount) : "Free"}</span>
          </li>
        </ul>
      </Panel>

      <Panel title="Downloads" className="mt-6">
        {order.downloads.length ? <DownloadRows downloads={order.downloads} /> : <p className="px-5 py-6 text-sm text-muted">Download links are created once the order is paid.</p>}
      </Panel>
    </>
  );
}
