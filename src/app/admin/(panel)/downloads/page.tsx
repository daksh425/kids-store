import { DownloadRows } from "@/components/admin/download-rows";
import { Empty, PageHeader, Panel, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime, orderLabel } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminDownloads() {
  await requireAdmin();
  const [grants, logs] = await Promise.all([
    db.download.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { title: true } }, order: { select: { id: true, number: true } } },
    }),
    db.downloadLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { download: { include: { product: { select: { title: true } }, order: { select: { number: true, user: { select: { email: true } } } } } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Downloads"
        description={`Each purchased file gets its own link with a download limit and expiry (set by DOWNLOAD_LIMIT and DOWNLOAD_EXPIRY_DAYS in .env).`}
      />
      <Panel title="Download links">{grants.length ? <DownloadRows downloads={grants} showOrder /> : <Empty>No downloads issued yet.</Empty>}</Panel>
      <Panel title="Recent download activity" className="mt-6">
        {logs.length ? (
          <Table>
            <thead>
              <tr>
                <th>When</th>
                <th>Product</th>
                <th>Order</th>
                <th>Customer</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</td>
                  <td className="font-bold">{l.download.product.title}</td>
                  <td>{orderLabel(l.download.order.number)}</td>
                  <td className="text-muted">{l.download.order.user.email}</td>
                  <td className="font-mono text-xs text-muted">{l.ip ?? "local"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty>No downloads yet.</Empty>
        )}
      </Panel>
    </>
  );
}
