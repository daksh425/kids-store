import { Empty, PageHeader, Panel, StatusBadge, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, inr } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { toggleCoupon } from "../actions";
import { CouponForm } from "./coupon-form";

export default async function AdminCoupons() {
  await requireAdmin();
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <>
      <PageHeader title="Coupons" description="Create discount codes and switch them off when a promotion ends." />
      <Panel title="New coupon">
        <CouponForm />
      </Panel>
      <Panel title="All coupons" className="mt-6">
        {coupons.length ? (
          <Table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min order</th>
                <th>Used</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = c.expiresAt != null && c.expiresAt < now;
                return (
                  <tr key={c.id}>
                    <td className="font-mono font-bold">{c.code}</td>
                    <td>{c.type === "PERCENT" ? `${c.value}% off` : `${inr(c.value)} off`}</td>
                    <td className="tabular-nums">{c.minOrder ? inr(c.minOrder) : "-"}</td>
                    <td className="tabular-nums">
                      {c.usedCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="whitespace-nowrap text-muted">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                    <td>
                      <StatusBadge status={expired ? "EXPIRED" : c.active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="text-right">
                      <form action={toggleCoupon}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="btn btn-sm btn-outline">{c.active ? "Disable" : "Enable"}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Empty>No coupons yet.</Empty>
        )}
      </Panel>
    </>
  );
}
