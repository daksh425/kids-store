import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/icons";
import { STORE_NAME } from "@/lib/catalog";
import { signOutAdmin } from "./actions";
import { AdminNav, NavLinks } from "./admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: `%s · Admin · ${STORE_NAME}` }, robots: { index: false } };

// Static chrome only. Every admin page and action checks the session itself
// (requireAdmin), because a layout check alone doesn't protect server actions.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-col bg-cream-dark/50 lg:flex-row">
      <aside className="border-b border-line bg-cream p-3 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-4">
        <div className="mb-3 flex items-center justify-between gap-2 lg:mb-6">
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark className="size-8" />
            <span className="font-display text-lg leading-tight font-bold">
              {STORE_NAME}
              <span className="block text-xs font-bold text-muted">Admin</span>
            </span>
          </Link>
          <div className="flex gap-1 lg:hidden">
            <Link href="/" className="btn btn-ghost btn-sm" aria-label="View store">
              <ExternalLink size={16} />
            </Link>
            <form action={signOutAdmin}>
              <button className="btn btn-ghost btn-sm" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
        <Suspense fallback={<NavLinks pathname="" />}>
          <AdminNav />
        </Suspense>
        <div className="mt-6 hidden space-y-1 border-t border-line pt-4 lg:block">
          <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-navy/75 hover:bg-white">
            <ExternalLink size={18} /> View store
          </Link>
          <form action={signOutAdmin}>
            <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-navy/75 hover:bg-white">
              <LogOut size={18} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
