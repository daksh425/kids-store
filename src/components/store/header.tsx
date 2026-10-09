"use client";

import { ChevronDown, Menu, ShoppingCart, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CategoryIcon, LogoMark } from "@/components/icons";
import { CATEGORIES, STORE_NAME } from "@/lib/catalog";
import { useCart } from "@/lib/client/cart";

const LINKS = [
  { href: "/free-resources", label: "Free Resources" },
  { href: "/bundles", label: "Bundles" },
  { href: "/grown-ups", label: "Grown-up Reads" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function CartLink({ onClick }: { onClick?: () => void }) {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      onClick={onClick}
      className="relative inline-flex size-11 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark"
      aria-label={count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
    >
      <ShoppingCart size={20} />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-sunny px-1 text-xs font-extrabold text-navy ring-2 ring-cream">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function Header() {
  const [kidsOpen, setKidsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const kidsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kidsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!kidsRef.current?.contains(e.target as Node)) setKidsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setKidsOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [kidsOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4 sm:h-[72px]">
        <Link href="/" className="flex items-center gap-2" onClick={closeMobile}>
          <LogoMark className="size-9" />
          <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">{STORE_NAME}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          <Link href="/" className="btn btn-ghost btn-sm">
            Home
          </Link>
          <div
            ref={kidsRef}
            className="relative"
            onMouseEnter={() => setKidsOpen(true)}
            onMouseLeave={() => setKidsOpen(false)}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-expanded={kidsOpen}
              aria-haspopup="true"
              onClick={() => setKidsOpen((v) => !v)}
            >
              Kids <ChevronDown size={16} className={`transition ${kidsOpen ? "rotate-180" : ""}`} />
            </button>
            {kidsOpen ? (
              <div className="absolute top-full left-1/2 w-72 -translate-x-1/2 pt-2">
                <div className="card p-2">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/kids/${c.slug}`}
                      onClick={() => setKidsOpen(false)}
                      className="flex items-center gap-3 rounded-2xl p-2.5 hover:bg-cream"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: c.tint, color: c.ink }}>
                        <CategoryIcon slug={c.slug} size={18} />
                      </span>
                      <span className="font-bold">{c.short}</span>
                    </Link>
                  ))}
                  <Link
                    href="/kids"
                    onClick={() => setKidsOpen(false)}
                    className="mt-1 block rounded-2xl p-2.5 text-center text-sm font-bold text-primary hover:bg-primary-50"
                  >
                    Browse all kids resources
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-ghost btn-sm">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Link href="/orders" className="hidden size-11 items-center justify-center rounded-full text-navy hover:bg-navy/5 sm:inline-flex" aria-label="My orders">
            <UserRound size={21} />
          </Link>
          <CartLink />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-navy/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-navy/40" onClick={closeMobile} />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto bg-cream p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-xl font-bold">Menu</span>
              <button type="button" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-navy/5" onClick={closeMobile} aria-label="Close menu">
                <X size={22} />
              </button>
            </div>
            <Link href="/" onClick={closeMobile} className="rounded-2xl px-3 py-3 font-bold hover:bg-white">
              Home
            </Link>
            <p className="mt-2 px-3 text-xs font-extrabold tracking-wider text-muted uppercase">Kids</p>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/kids/${c.slug}`} onClick={closeMobile} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold hover:bg-white">
                <span className="grid size-8 place-items-center rounded-lg" style={{ background: c.tint, color: c.ink }}>
                  <CategoryIcon slug={c.slug} size={16} />
                </span>
                {c.short}
              </Link>
            ))}
            <div className="my-3 border-t border-line" />
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={closeMobile} className="rounded-2xl px-3 py-3 font-bold hover:bg-white">
                {l.label}
              </Link>
            ))}
            <Link href="/orders" onClick={closeMobile} className="rounded-2xl px-3 py-3 font-bold hover:bg-white">
              My orders &amp; downloads
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
