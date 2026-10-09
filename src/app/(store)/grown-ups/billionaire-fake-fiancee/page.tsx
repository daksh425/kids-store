import { BookOpen, ChevronDown, Clock, Download, FileText, Heart, Lock, Smartphone, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Stars } from "@/components/stars";
import { BOOK_SLUG, characters, faqs, openingExcerpt, rules, tropes } from "@/content/billionaire-fake-fiancee";
import { STORE_NAME } from "@/lib/catalog";
import { appUrl } from "@/lib/config";
import { db } from "@/lib/db";
import { inr } from "@/lib/format";
import { thumbnailUrl } from "@/lib/media";
import { discountPercent, effectivePrice } from "@/lib/pricing";
import { bookFonts } from "../fonts";

const COVER = thumbnailUrl(`seed-${BOOK_SLUG}.jpg`)!;
const TITLE = "Billionaire Fake Fiancée";

export const metadata: Metadata = {
  title: `${TITLE}: a sweet Mumbai romance`,
  description:
    "A bookseller, a billionaire and a fake engagement written on a napkin. A sweet, swoony Mumbai romance novella from BrightBuds Reads. Read Chapter One free.",
  openGraph: { title: TITLE, description: "One contract. Six weeks. Zero chance of falling in love.", images: [COVER], type: "book" },
};

/** Renders the manuscript's *italic* markers. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? <em key={i}>{part.slice(1, -1)}</em> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

async function getBook() {
  return db.product.findFirst({
    where: { slug: BOOK_SLUG, status: "PUBLISHED" },
    select: { id: true, price: true, discountPrice: true, pages: true },
  });
}

async function BuyBox({ variant }: { variant: "hero" | "footer" }) {
  const book = await getBook();
  if (!book) {
    return <p className="font-bold text-gold">Coming soon to {STORE_NAME}.</p>;
  }
  const now = effectivePrice(book);
  const off = discountPercent(book);
  return (
    <div>
      <div className={`flex flex-wrap items-baseline gap-x-3 ${variant === "footer" ? "justify-center" : ""}`}>
        <span className="font-book-display text-4xl text-white">{inr(now)}</span>
        {off > 0 ? (
          <>
            <s className="text-lg text-white/50">{inr(book.price)}</s>
            <span className="rounded-full bg-[#f3a9c1] px-2.5 py-0.5 text-xs font-extrabold text-[#2a1744]">Launch price · {off}% off</span>
          </>
        ) : null}
      </div>
      <div className={`mt-5 flex flex-wrap gap-3 ${variant === "footer" ? "justify-center" : ""}`}>
        <Link href={`/checkout?buy=${book.id}`} className="btn btn-lg bg-[#e7c87f] text-[#2a1744] shadow-[0_5px_0_-1px_#a8853a] hover:brightness-105 active:translate-y-0.5">
          <Heart size={20} className="fill-current" /> Buy the book
        </Link>
        <Link href={`/sample/${BOOK_SLUG}`} className="btn btn-lg border-2 border-white/30 text-white hover:bg-white/10">
          <BookOpen size={20} /> Read Chapter One free
        </Link>
      </div>
    </div>
  );
}

async function Reviews() {
  const book = await db.product.findFirst({ where: { slug: BOOK_SLUG }, select: { id: true } });
  if (!book) return null;
  const [reviews, agg] = await Promise.all([
    db.review.findMany({ where: { productId: book.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.review.aggregate({ where: { productId: book.id }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  // Real reader reviews only; the section stays hidden until there are some.
  if (!reviews.length || !agg._avg.rating) return null;
  return (
    <section className="container-page pt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-book-display text-4xl text-[#2a1744]">What readers say</h2>
        <span className="flex items-center gap-2 text-sm font-bold text-muted">
          <Stars rating={agg._avg.rating} /> {agg._avg.rating.toFixed(1)} from {agg._count._all} verified reader{agg._count._all === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.id} className="card p-6">
            <Stars rating={r.rating} size={15} />
            <blockquote className="mt-3 font-book-serif leading-relaxed italic text-navy/80">“{r.comment}”</blockquote>
            <figcaption className="mt-3 text-sm font-bold">{r.name} · verified reader</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default function BillionaireFakeFianceeLanding() {
  const excerpt = openingExcerpt();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: TITLE,
    bookFormat: "https://schema.org/EBook",
    inLanguage: "en-IN",
    genre: "Romance",
    publisher: { "@type": "Organization", name: "BrightBuds Reads" },
    image: `${appUrl()}${COVER}`,
    description: "A bookseller, a billionaire and a fake engagement written on a napkin. A sweet Mumbai romance.",
  };

  return (
    <div className={bookFonts}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="night-sky relative overflow-hidden text-white">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e7c87f]/40 px-3 py-1 text-xs font-extrabold tracking-[0.18em] text-gold uppercase">
              <Sparkles size={14} /> A BrightBuds Reads Original
            </p>
            <h1 className="mt-6 leading-none">
              <span className="block font-book-display text-[2.55rem] tracking-wide text-gold sm:text-6xl lg:text-7xl">BILLIONAIRE</span>
              <span className="-my-3 block pl-10 font-book-script text-7xl text-blush sm:-my-5 sm:text-8xl lg:text-9xl">Fake</span>
              <span className="block font-book-display text-6xl tracking-wide text-gold sm:text-7xl lg:text-8xl">FIANCÉE</span>
            </h1>
            <p className="mt-7 max-w-xl font-book-serif text-xl leading-relaxed text-white/85 italic">
              One contract. Six weeks. Zero chance of falling in love.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-white/70">
              A struggling bookseller, a reclusive billionaire, and a fake engagement written on a café napkin, in the middle of a
              Mumbai monsoon. A sweet, swoony novella you can finish in one cosy evening.
            </p>
            <div className="mt-8">
              <Suspense fallback={<div className="h-28" />}>
                <BuyBox variant="hero" />
              </Suspense>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
              <li className="flex items-center gap-1.5">
                <Download size={15} className="text-gold" /> Instant access
              </li>
              <li className="flex items-center gap-1.5">
                <BookOpen size={15} className="text-gold" /> Page-turning online reader
              </li>
              <li className="flex items-center gap-1.5">
                <Heart size={15} className="text-gold" /> Sweet &amp; clean
              </li>
            </ul>
          </div>

          <div className="book3d mx-auto w-full max-w-[19rem] py-6 sm:max-w-sm">
            <div className="book3d__inner">
              <div className="book3d__pages" aria-hidden="true" />
              <div className="book3d__cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={COVER} alt={`Cover of ${TITLE}`} width={800} height={1200} className="block w-full" />
              </div>
            </div>
          </div>
        </div>
        <a href="#story" className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-white/50 hover:text-white sm:block" aria-label="Scroll to the story">
          <ChevronDown size={28} />
        </a>
      </section>

      {/* Tropes */}
      <section className="border-b border-line bg-white">
        <div className="container-page flex flex-wrap items-center justify-center gap-2 py-5">
          <span className="mr-1 text-sm font-bold text-muted">You’ll love it if you love</span>
          {tropes.map((t) => (
            <span key={t} className="rounded-full bg-[#f1ecf6] px-3 py-1 text-sm font-bold text-[#4a2c6e]">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* The story + the napkin */}
      <section id="story" className="container-page grid scroll-mt-20 items-center gap-12 pt-20 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-book-script text-4xl text-primary">The story</p>
          <h2 className="mt-1 font-book-display text-4xl leading-tight text-[#2a1744] sm:text-5xl">A deal on a napkin. A love story nobody planned.</h2>
          <div className="mt-6 space-y-4 font-book-serif text-lg leading-relaxed text-navy/80">
            <p>
              Tara Mehta has thirty-seven days to save her late father’s bookshop on Sea Lane. Kabir Rathore, the reclusive CEO whose
              company now owns her building, has six weeks to convince his formidable grandmother that he is more than a glass tower.
            </p>
            <p>
              One monsoon afternoon and one spilled glass of chai later, they strike a deal: a fake engagement until Dadi’s eightieth
              birthday, and a ten-year lease for the shop.
            </p>
            <p>
              But between Sunday lunches on Malabar Hill, a hopeless first dance, midnight vada pav on the forty-second floor and a
              library that has been locked for twenty years, the rules start to bend. And when a jealous cousin threatens to expose
              everything at the party of the year, Tara and Kabir have to decide whether any of it was ever really pretend.
            </p>
          </div>
        </div>
        <figure className="napkin mx-auto w-full max-w-sm rotate-2 rounded-sm p-8 shadow-lift">
          <figcaption className="text-center font-book-script text-4xl text-primary">The Rules</figcaption>
          <ol className="mt-5 space-y-3 font-book-serif text-[15px] leading-snug text-navy">
            {rules.map((r, i) => (
              <li key={r} className="flex gap-3">
                <span className="font-book-display text-lg leading-none text-[#b88a3b]">{i + 1}</span>
                <span className="italic">{r}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-center text-xs text-muted italic">Written on a café napkin, Bandra. Signed by both parties.</p>
        </figure>
      </section>

      {/* Characters */}
      <section className="container-page pt-24">
        <p className="text-center font-book-script text-4xl text-primary">Meet</p>
        <h2 className="text-center font-book-display text-4xl text-[#2a1744] sm:text-5xl">The people of Sea Lane &amp; Malabar Hill</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {characters.map((c, i) => (
            <article key={c.name} className="card p-6">
              <span
                className="grid size-14 place-items-center rounded-full font-book-display text-2xl text-white"
                style={{ background: ["#d02b65", "#2a1744", "#b88a3b", "#4a2c6e"][i] }}
              >
                {c.name.replace(/[“”"]/g, "")[0]}
              </span>
              <h3 className="mt-4 font-book-display text-2xl text-[#2a1744]">{c.name}</h3>
              <p className="text-sm font-extrabold tracking-wider text-primary uppercase">{c.role}</p>
              <p className="mt-3 font-book-serif leading-relaxed text-navy/75">{c.line}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Excerpt */}
      <section className="pt-24">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <p className="text-center font-book-script text-4xl text-primary">Read the opening</p>
            <h2 className="text-center font-book-display text-4xl text-[#2a1744]">Chapter One: A Ruined First Edition</h2>
            <article className="relative mt-8 overflow-hidden rounded-3xl border border-line bg-[#fffcf6] px-6 py-10 shadow-card sm:px-14">
              <div className="space-y-4 font-book-serif text-[17px] leading-[1.85] text-navy/90">
                {excerpt.map((p, i) => (
                  <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:font-book-display first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-primary" : "indent-6"}>
                    <Inline text={p} />
                  </p>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fffcf6] to-transparent" />
            </article>
            <div className="mt-6 text-center">
              <Link href={`/sample/${BOOK_SLUG}`} className="btn btn-lg btn-primary">
                <BookOpen size={20} /> Keep reading Chapter One, free
              </Link>
              <p className="mt-3 text-sm text-muted">Opens as a page-turning book. No sign-up needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="container-page pt-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FileText, title: "10 chapters + epilogue", body: "A complete story with a happy ending, about 15,000 words." },
            { icon: Clock, title: "One cosy evening", body: "Around an hour and a half of reading, start to finish." },
            { icon: Smartphone, title: "Read anywhere", body: "A page-turning book in your browser on phone, tablet or laptop." },
            { icon: Lock, title: "Yours to keep", body: "Download the beautifully designed PDF too. Secure checkout by Razorpay." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl bg-[#f1ecf6] p-6">
              <Icon className="text-[#4a2c6e]" />
              <h3 className="mt-3 font-book-display text-xl text-[#2a1744]">{title}</h3>
              <p className="mt-1 text-navy/70">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <Reviews />
      </Suspense>

      {/* FAQ */}
      <section className="container-page max-w-3xl pt-24">
        <h2 className="text-center font-book-display text-4xl text-[#2a1744]">Good to know</h2>
        <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-white">
          {faqs.map((f) => (
            <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                {f.q}
                <ChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="container-page pt-24">
        <div className="night-sky overflow-hidden rounded-[2.5rem] px-6 py-14 text-center text-white sm:px-12">
          <p className="font-book-script text-5xl text-blush">Rule One:</p>
          <p className="mt-1 font-book-display text-3xl text-gold sm:text-4xl">nobody falls in love.</p>
          <p className="mx-auto mt-4 max-w-md font-book-serif text-white/75 italic">They were both very good at keeping promises. Until they weren’t.</p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-28" />}>
              <BuyBox variant="footer" />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
