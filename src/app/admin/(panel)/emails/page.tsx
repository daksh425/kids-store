import Link from "next/link";
import { Empty, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { emailDeliveryEnabled } from "@/lib/config";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export default async function AdminEmails({ searchParams }: PageProps<"/admin/emails">) {
  await requireAdmin();
  const sp = await searchParams;
  const emails = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, to: true, subject: true, status: true, error: true, createdAt: true } });
  const selectedId = typeof sp.id === "string" ? sp.id : emails[0]?.id;
  const selected = selectedId ? await db.emailLog.findUnique({ where: { id: selectedId } }) : null;

  return (
    <>
      <PageHeader
        title="Emails"
        description={
          emailDeliveryEnabled()
            ? "Every email the store has sent."
            : "SMTP isn't configured, so emails are saved here instead of sent. Set SMTP_HOST and friends in .env to deliver them."
        }
      />
      {emails.length ? (
        <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
          <Panel>
            <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
              {emails.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/emails?id=${e.id}`} className={`block px-4 py-3 text-sm hover:bg-cream ${e.id === selectedId ? "bg-primary-50" : ""}`}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold">{e.subject}</span>
                      <StatusBadge status={e.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {e.to} · {formatDateTime(e.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          {selected ? (
            <Panel title={selected.subject}>
              <p className="border-b border-line px-5 py-2 text-sm text-muted">
                To {selected.to} · {formatDateTime(selected.createdAt)}
                {selected.error ? <span className="block font-bold text-coral-ink">{selected.error}</span> : null}
              </p>
              <iframe title="Email preview" srcDoc={selected.html} sandbox="allow-popups allow-popups-to-escape-sandbox" className="h-[640px] w-full bg-cream" />
            </Panel>
          ) : null}
        </div>
      ) : (
        <Panel>
          <Empty>No emails yet.</Empty>
        </Panel>
      )}
    </>
  );
}
