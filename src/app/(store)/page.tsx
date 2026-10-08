import { ArrowRight, Download, Gift, GraduationCap, Heart, Lightbulb, Printer, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { CATEGORIES } from "@/lib/catalog";
import { db } from "@/lib/db";
import { thumbnailUrl } from "@/lib/media";
import { bestSellers, categoryCounts, newArrivals } from "@/lib/products";

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-sm font-extrabold tracking-wider text-primary uppercase">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="hidden shrink-0 items-center gap-1 font-bold text-primary hover:underline sm:inline-flex">
          {linkLabel} <ArrowRight size={18} />
        </Link>
      ) : null}
    </div>
  );
}

const TRUST = [
  { icon: Zap, label: "Instant Download", color: "#D02B65" },
  { icon: Printer, label: "Printable Fun", color: "#4DA3FF" },
  { icon: ShieldCheck, label: "Secure Payment", color: "#1D7A58" },
  { icon: Lightbulb, label: "Learning Focused", color: "#B8392A" },
];

const REASONS = [
  {
    icon: Download,
    title: "Instant access",
    body: "Pay and download in seconds. No shipping, no waiting: start an activity the moment you need one.",
    tint: "bg-primary-50 text-primary",
  },
  {
    icon: Printer,
    title: "Print again and again",
    body: "Every purchase is a printable PDF. Print a fresh copy for each child, each week, or each rainy afternoon.",
    tint: "bg-secondary-50 text-[#1F65B8]",
  },
  {
    icon: GraduationCap,
    title: "Made for their age",
    body: "Everything is grouped by age, from first shapes at 2 to brain teasers at 10, so it's never too easy or too hard.",
    tint: "bg-mint-50 text-mint-ink",
  },
];

export default async function HomePage() {
  const [best, fresh, counts, freebie] = await Promise.all([
    bestSellers({ limit: 8 }),
    newArrivals(4),
    categoryCounts(),
    db.product.findFirst({ where: { status: "PUBLISHED", price: 0 }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] }),
  ]);
  const heroCovers = best.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-[28rem] rounded-full bg-sunny/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute top-40 -left-32 size-[22rem] rounded-full bg-secondary/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="chip bg-white text-primary shadow-card">
              <Sparkles size={16} /> Printable resources for ages 2–12
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl">
              Learning <span className="relative whitespace-nowrap text-primary">Made Fun<svg aria-hidden="true" viewBox="0 0 300 20" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none"><path d="M3 14 C 80 4, 200 4, 297 12" stroke="#FFD95A" strokeWidth="8" fill="none" strokeLinecap="round" /></svg></span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Story e-books, colouring pages, activity books and worksheets that kids love and parents trust. Pay once,
              download instantly, print as often as you like.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/kids" className="btn btn-lg btn-primary">
                Explore resources <ArrowRight size={20} />
              </Link>
              <Link href="/free-resources" className="btn btn-lg btn-sunny">
                <Gift size={20} /> Free resources
              </Link>
            </div>
          </div>
          <div className="relative mx-auto h-[340px] w-full max-w-md sm:h-[420px]" aria-hidden="true">
            {heroCovers.map((p, i) => {
              const url = thumbnailUrl(p.thumbnail);
              const pos = [
                "left-[4%] top-10 -rotate-6 z-10",
                "left-1/2 -translate-x-1/2 top-0 z-20",
                "right-[4%] top-12 rotate-6 z-10",
              ][i];
              return url ? (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  tabIndex={-1}
                  className={`absolute w-[44%] overflow-hidden rounded-3xl border-4 border-white shadow-lift transition hover:scale-[1.03] ${pos}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />
                </Link>
              ) : null;
            })}
            <div className="absolute bottom-0 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold whitespace-nowrap shadow-card">
              <Heart size={16} className="fill-coral text-coral" /> Printable at home, any time
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-white">
        <ul className="container-page grid grid-cols-2 gap-y-4 py-5 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, label, color }) => (
            <li key={label} className="flex items-center justify-center gap-2.5 font-bold">
              <Icon size={22} style={{ color }} /> {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      <section className="container-page pt-16">
        <SectionHeading eyebrow="Shop by category" title="What are we learning today?" href="/kids" linkLabel="See everything" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/kids/${c.slug}`}
              className="group flex flex-col rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-lift"
              style={{ background: c.tint }}
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-white shadow-card" style={{ color: c.ink }}>
                <CategoryIcon slug={c.slug} size={28} />
              </span>
              <span className="mt-4 font-display text-xl font-semibold">{c.short}</span>
              <span className="mt-1 text-sm leading-snug text-muted">{c.description}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold" style={{ color: c.ink }}>
                {counts[c.slug] ?? 0} resources <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="container-page pt-16">
        <SectionHeading eyebrow="Parents' favourites" title="Best sellers" href="/kids?sort=popular" linkLabel="Shop all" />
        <ProductGrid products={best} />
      </section>

      {/* Why parents love us */}
      <section className="container-page pt-16">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-card sm:p-10">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Why parents love us</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {REASONS.map(({ icon: Icon, title, body, tint }) => (
              <div key={title} className="rounded-3xl bg-cream p-6">
                <span className={`grid size-12 place-items-center rounded-2xl ${tint}`}>
                  <Icon size={24} />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-page pt-16">
        <SectionHeading eyebrow="Just added" title="New arrivals" href="/kids?sort=newest" linkLabel="See what's new" />
        <ProductGrid products={fresh} />
      </section>

      {/* Free resource CTA */}
      {freebie ? (
        <section className="container-page pt-16">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-10 text-white sm:px-12 sm:py-14">
            <div aria-hidden="true" className="absolute -right-10 -bottom-16 size-64 rounded-full bg-sunny/30" />
            <div aria-hidden="true" className="absolute top-6 right-40 size-10 rounded-full bg-mint/60" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="chip bg-white/15 text-sunny">
                  <Gift size={16} /> Free download
                </p>
                <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Try us free: {freebie.title}</h2>
                <p className="mt-3 max-w-lg text-lg text-white/85">{freebie.shortDescription} No payment needed, just your email so we can send you the link.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/product/${freebie.slug}`} className="btn btn-lg btn-sunny">
                    Get it free <ArrowRight size={20} />
                  </Link>
                  <Link href="/free-resources" className="btn btn-lg border-2 border-white/30 text-white hover:bg-white/10">
                    All free resources
                  </Link>
                </div>
              </div>
              {thumbnailUrl(freebie.thumbnail) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl(freebie.thumbnail)!}
                  alt=""
                  className="mx-auto w-48 rotate-3 rounded-3xl border-4 border-white shadow-2xl sm:w-56"
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
