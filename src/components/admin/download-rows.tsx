import { KeyRound, RotateCcw } from "lucide-react";
import Link from "next/link";
import { resetDownload, revokeDownload } from "@/app/admin/(panel)/actions";
import { formatDate, formatDateTime, orderLabel } from "@/lib/format";
import { ConfirmButton } from "./confirm-button";
import { StatusBadge, Table } from "./ui";

type Row = {
  id: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: Date;
  lastDownloadedAt: Date | null;
  product: { title: string };
  order: { id: string; number: number };
};

export function DownloadRows({ downloads, showOrder = false }: { downloads: Row[]; showOrder?: boolean }) {
  const now = new Date();
  return (
    <Table>
      <thead>
        <tr>
          <th>Product</th>
          {showOrder ? <th>Order</th> : null}
          <th>Used</th>
          <th>Expires</th>
          <th>Last download</th>
          <th className="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {downloads.map((d) => {
          const expired = d.expiresAt < now;
          const used = d.downloadCount >= d.maxDownloads;
          return (
            <tr key={d.id}>
              <td className="font-bold">{d.product.title}</td>
              {showOrder ? (
                <td>
                  <Link href={`/admin/orders/${d.order.id}`} className="font-bold text-primary hover:underline">
                    {orderLabel(d.order.number)}
                  </Link>
                </td>
              ) : null}
              <td className="whitespace-nowrap tabular-nums">
                {d.downloadCount} / {d.maxDownloads} {used ? <StatusBadge status="FAILED" /> : null}
              </td>
              <td className="whitespace-nowrap">{expired ? <StatusBadge status="EXPIRED" /> : formatDate(d.expiresAt)}</td>
              <td className="whitespace-nowrap text-muted">{d.lastDownloadedAt ? formatDateTime(d.lastDownloadedAt) : "Never"}</td>
              <td>
                <div className="flex justify-end gap-1.5">
                  <form action={resetDownload}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="btn btn-sm btn-outline" title="Set count to 0 and extend expiry">
                      <RotateCcw size={14} /> Reset
                    </button>
                  </form>
                  <form action={revokeDownload}>
                    <input type="hidden" name="id" value={d.id} />
                    <ConfirmButton message="Issue a new link? The old link (including the one in the email) will stop working." className="btn btn-sm btn-outline">
                      <KeyRound size={14} /> New link
                    </ConfirmButton>
                  </form>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
