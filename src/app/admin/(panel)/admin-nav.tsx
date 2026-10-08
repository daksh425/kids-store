"use client";

import { Download, Inbox, LayoutDashboard, Mail, Package, ReceiptText, Ticket, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/downloads", label: "Downloads", icon: Download },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
];

export function AdminNav() {
  return <NavLinks pathname={usePathname()} />;
}

/** Plain links with an optional highlight; also the prerendered fallback before the URL is known. */
export function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold transition ${
              active ? "bg-primary text-white" : "text-navy/75 hover:bg-white hover:text-navy"
            }`}
          >
            <Icon size={18} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
