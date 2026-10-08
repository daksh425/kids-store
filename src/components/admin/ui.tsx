import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {description ? <p className="mt-1 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tint }: { label: string; value: string; sub?: string; icon: LucideIcon; tint: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-muted">{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${tint}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-sm text-muted">{sub}</p> : null}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-extrabold [&_th]:tracking-wide [&_th]:text-muted [&_th]:uppercase [&_thead]:bg-cream [&_tr]:border-b [&_tr]:border-line [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-cream/60">
        {children}
      </table>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-mint-50 text-mint-ink",
  PUBLISHED: "bg-mint-50 text-mint-ink",
  ACTIVE: "bg-mint-50 text-mint-ink",
  sent: "bg-mint-50 text-mint-ink",
  CREATED: "bg-sunny-50 text-[#8A6400]",
  DRAFT: "bg-sunny-50 text-[#8A6400]",
  logged: "bg-secondary-50 text-[#1F65B8]",
  FAILED: "bg-coral-50 text-coral-ink",
  failed: "bg-coral-50 text-coral-ink",
  ARCHIVED: "bg-navy/5 text-muted",
  INACTIVE: "bg-navy/5 text-muted",
  EXPIRED: "bg-navy/5 text-muted",
};

const STATUS_LABELS: Record<string, string> = { CREATED: "Pending", logged: "Logged (no SMTP)" };

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-navy/5 text-muted"}`}>
      {STATUS_LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-10 text-center text-muted">{children}</p>;
}

export function Notice({ children, tone = "good" }: { children: React.ReactNode; tone?: "good" | "info" }) {
  return (
    <p className={`mb-5 rounded-2xl px-4 py-3 text-sm font-bold ${tone === "good" ? "bg-mint-50 text-mint-ink" : "bg-secondary-50 text-[#1F65B8]"}`}>{children}</p>
  );
}
