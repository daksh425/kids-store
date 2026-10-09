import { Moon } from "lucide-react";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-card";
import { listProducts } from "@/lib/products";
import { bookFonts } from "./fonts";

export const metadata: Metadata = {
  title: "Grown-up Reads",
  description: "Novels and novellas for the grown-ups, from BrightBuds Reads. Sweet romance to read after the kids are asleep.",
};

export default async function GrownUpsPage() {
  const books = await listProducts({ audience: "adults", sort: "newest" });
  return (
    <div className={bookFonts}>
      <section className="night-sky text-white">
        <div className="container-page py-14 sm:py-16">
          <p className="inline-flex items-center gap-2 text-sm font-extrabold tracking-[0.18em] text-gold uppercase">
            <Moon size={16} /> BrightBuds Reads
          </p>
          <h1 className="mt-4 font-book-display text-5xl sm:text-6xl">
            Grown-up <span className="font-book-script text-blush">Reads</span>
          </h1>
          <p className="mt-4 max-w-2xl font-book-serif text-lg leading-relaxed text-white/80 italic">
            Because the grown-ups deserve a happily-ever-after too. Stories to read once the little ones are asleep: on your phone,
            as a page-turning book, or printed and curled up with.
          </p>
        </div>
      </section>
      <div className="container-page py-10">
        {books.length ? <ProductGrid products={books} /> : <p className="text-muted">Our first grown-up stories are on their way.</p>}
      </div>
    </div>
  );
}
