import { Lock } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { CATEGORIES, STORE_NAME } from "@/lib/catalog";

export function Footer() {
  return (
    <footer className="mt-20 bg-navy text-white/80">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <LogoMark className="size-9" />
            <span className="font-display text-xl font-bold">{STORE_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">
            Printable stories, colouring, puzzles and worksheets that help little minds bloom, one page at a time.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
            <Lock size={14} /> Secure payments by Razorpay
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/kids/${c.slug}`} className="hover:text-sunny">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/free-resources" className="hover:text-sunny">
                Free resources
              </Link>
            </li>
            <li>
              <Link href="/grown-ups" className="hover:text-sunny">
                Grown-up Reads
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/orders" className="hover:text-sunny">
                My orders &amp; downloads
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-sunny">
                About us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-sunny">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Policies</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/terms" className="hover:text-sunny">
                Terms of use
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-sunny">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-sunny">
                Refund &amp; download policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page py-5 text-xs text-white/60">
          © {STORE_NAME}. Made for curious kids and the grown-ups who cheer them on.
        </div>
      </div>
    </footer>
  );
}
