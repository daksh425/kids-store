import { CircleAlert, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/customer";
import { db } from "@/lib/db";
import { formatDate, inr, orderLabel } from "@/lib/format";
import { signOut } from "./actions";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

const STATUS = {
  PAID: { label: "Ready to download", className: "bg-mint-50 text-mint-ink" },
  CREATED: { label: "Awaiting payment", className: "bg-sunny-50 text-[#8A6400]" },
  FAILED: { label: "Payment failed", className: "bg-coral-50 text-coral-ink" },
} as const;

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const [user, orders] = await Promise.all([
    viewer.customerId ? db.user.findUnique({ where: { id: viewer.customerId } }) : null,
    viewer.customerId || viewer.browserOrderIds.length
      ? db.order.findMany({
          where: {
            OR: [
              ...(viewer.customerId ? [{ userId: viewer.customerId }] : []),
              ...(viewer.browserOrderIds.length ? [{ id: { in: viewer.browserOrderIds } }] : []),
            ],
          },
          include: { items: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);
  // Unpaid attempts clutter the list; keep them only if they're the latest thing.
  const visible = orders.filter((o, i) => o.status === "PAID" || i === 0);

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">My orders</h1>
          <p className="mt-1 text-muted">{user ? `Signed in as ${user.email}` : "Your purchases and download links."}</p>
        </div>
        {user ? (
          <form action={signOut}>
            <button className="btn btn-outline btn-sm">Sign out</button>
          </form>
        ) : null}
      </div>

      {sp.link === "invalid" ? (
        <p role="alert" className="mt-6 flex gap-2 rounded-2xl bg-coral-50 p-4 font-bold text-coral-ink">
          <CircleAlert size={20} className="shrink-0" /> That sign-in link has expired or was already used. Request a new one below.
        </p>
      ) : null}
      {sp.download === "invalid" ? (
        <p role="alert" className="mt-6 flex gap-2 rounded-2xl bg-coral-50 p-4 font-bold text-coral-ink">
          <CircleAlert size={20} className="shrink-0" /> That download link isn&apos;t valid. Find your files below, or sign in with your email.
        </p>
      ) : null}

      {visible.length ? (
        <ul className="mt-6 space-y-3">
          {visible.map((o) => (
            <li key={o.id}>
              <Link href={`/order/${o.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift sm:p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary">
                  <Package size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{o.items.map((i) => i.title).join(", ")}</p>
                  <p className="text-sm text-muted">
                    {orderLabel(o.number)} · {formatDate(o.createdAt)} · {o.amount === 0 ? "Free" : inr(o.amount)}
                  </p>
                </div>
                <span className={`chip hidden shrink-0 sm:inline-flex ${STATUS[o.status].className}`}>{STATUS[o.status].label}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-muted">{user ? "No orders on this email yet." : "No orders from this browser yet."}</p>
      )}

      {user ? null : (
        <div className="card mt-8 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Bought on another device?</h2>
          <p className="mt-1 mb-4 text-sm text-muted">Enter your checkout email and we&apos;ll send a one-time link to see every order and download.</p>
          <LoginForm />
        </div>
      )}
    </div>
  );
}
