import { Trash2 } from "lucide-react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Empty, PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { deleteMessage } from "../actions";

export default async function AdminMessages() {
  await requireAdmin();
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Messages" description="Sent from the Contact page." />
      <Panel>
        {messages.length ? (
          <ul className="divide-y divide-line">
            {messages.map((m) => (
              <li key={m.id} className="flex gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <strong>{m.name}</strong>{" "}
                    <a href={`mailto:${m.email}`} className="text-primary hover:underline">
                      {m.email}
                    </a>{" "}
                    <span className="text-muted">· {formatDateTime(m.createdAt)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-line text-muted">{m.message}</p>
                </div>
                <form action={deleteMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton message="Delete this message?" className="btn btn-sm btn-ghost text-muted">
                    <Trash2 size={16} />
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No messages yet.</Empty>
        )}
      </Panel>
    </>
  );
}
