import { CheckCircle2, ChevronRight, Download, FileText, Lock, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Price } from "@/components/price";
import { ProductGrid } from "@/components/product-card";
import { Stars } from "@/components/stars";
import { ageLabel, getCategory } from "@/lib/catalog";
import { appUrl, downloadPolicy } from "@/lib/config";
import { findPurchase } from "@/lib/customer";
import { formatBytes, formatDate } from "@/lib/format";
import { thumbnailUrl } from "@/lib/media";
import { effectivePrice } from "@/lib/pricing";
import { getProductMeta, getProductReviews, getPublishedProduct, relatedProducts } from "@/lib/products";
import { BuyBox, ReviewForm, ViewTracker } from "./client";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProductMeta((await params).slug);
  if (!product) return {};
  const thumb = thumbnailUrl(product.thumbnail);
  return {
    title: product.title,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: thumb ? { images: [thumb] } : undefined,
  };
}

async function ReviewGate({ productId }: { productId: string }) {
  const buyer = await findPurchase(productId);
  return buyer ? <ReviewForm productId={productId} /> : null;
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = await getPublishedProduct((await params).slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const [{ reviews, rating, count }, { related, bundles }] = await Promise.all([
    getProductReviews(product.id),
    relatedProducts(product),
  ]);
  const price = effectivePrice(product);
  const thumb = thumbnailUrl(product.thumbnail);
  const free = price === 0;

  const facts = [
    { label: "Format", value: product.format },
    product.pages ? { label: "Pages", value: `${product.pages} pages` } : null,
    { label: "Age range", value: ageLabel(product.ageGroup) },
    product.fileSize ? { label: "File size", value: formatBytes(product.fileSize) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        // Escape "<" so product text can never close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            description: product.shortDescription || product.description,
            ...(thumb ? { image: `${appUrl()}${thumb}` } : {}),
            category: category?.name,
            offers: { "@type": "Offer", price, priceCurrency: "INR", availability: "https://schema.org/InStock" },
            ...(count > 0 && rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.toFixed(1), reviewCount: count } } : {}),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <ViewTracker productId={product.id} title={product.title} price={price} />
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm font-bold text-muted">
        <Link href="/kids" className="hover:text-primary">
          Kids
        </Link>
        <ChevronRight size={14} />
        {category ? (
          <Link href={`/kids/${category.slug}`} className="hover:text-primary">
            {category.short}
          </Link>
        ) : null}
        <ChevronRight size={14} />
        <span className="text-navy">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:sticky lg:top-24 lg:max-w-none lg:self-start">
          <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-lift" style={{ background: category?.tint }}>
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt={`Cover of ${product.title}`} className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="aspect-[3/4]" />
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {category ? (
              <Link href={`/kids/${category.slug}`} className="chip" style={{ background: category.tint, color: category.ink }}>
                {category.name}
              </Link>
            ) : null}
            <span className="chip bg-white text-navy shadow-card">{ageLabel(product.ageGroup)}</span>
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight font-bold sm:text-5xl">{product.title}</h1>
          {count > 0 && rating ? (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-primary">
              <Stars rating={rating} /> {rating.toFixed(1)} · {count} review{count === 1 ? "" : "s"}
            </a>
          ) : null}
          <p className="mt-4 text-lg leading-relaxed text-muted">{product.shortDescription}</p>

          <div className="card mt-6 p-5 sm:p-6">
            <Price price={product.price} discountPrice={product.discountPrice} size="lg" />
            <div className="mt-5">
              <BuyBox
                item={{ id: product.id, slug: product.slug, title: product.title, price, thumbnail: product.thumbnail, category: product.category }}
              />
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-mint-50 p-4 text-sm">
              <Download size={20} className="mt-0.5 shrink-0 text-mint-ink" />
              <p>
                <strong>Instant digital download.</strong>{" "}
                {free
                  ? "Enter your name and email and the PDF is yours straight away. Nothing is posted to you."
                  : `Your PDF is ready the moment payment succeeds, and we email you the link too. Each link allows ${downloadPolicy.limit} downloads over ${downloadPolicy.expiryDays} days. Nothing is posted to you.`}
              </p>
            </div>
            {free ? null : (
              <p className="mt-3 flex items-center gap-2 text-xs font-bold text-muted">
                <Lock size={14} /> Secure checkout with UPI, cards, net banking and wallets via Razorpay
              </p>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl bg-white p-3 text-center shadow-card">
                <dt className="text-xs font-bold text-muted uppercase">{f.label}</dt>
                <dd className="mt-0.5 font-display font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>

          {product.includes.length ? (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-semibold">What&apos;s included</h2>
              <ul className="mt-3 space-y-2">
                {product.includes.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-mint-ink" />
                    <span>{line}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2.5">
                  <Printer size={20} className="mt-0.5 shrink-0 text-mint-ink" />
                  <span>Print as many copies as you need for your family or classroom</span>
                </li>
              </ul>
            </section>
          ) : null}

          <section className="mt-8">
            <h2 className="font-display text-2xl font-semibold">About this resource</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <FileText size={16} /> A4 PDF, works on any phone, tablet or computer, and prints on any home printer.
            </p>
          </section>

          <section id="reviews" className="mt-10 scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold">Reviews</h2>
            <div className="mt-4 space-y-4">
              <Suspense fallback={null}>
                <ReviewGate productId={product.id} />
              </Suspense>
              {reviews.length === 0 ? (
                <p className="text-muted">No reviews yet. Customers who buy this can leave one from this page.</p>
              ) : (
                reviews.map((r) => (
                  <article key={r.id} className="rounded-3xl bg-white p-5 shadow-card">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars rating={r.rating} size={15} />
                      <span className="font-bold">{r.name}</span>
                      <span className="text-sm text-muted">Verified buyer · {formatDate(r.createdAt)}</span>
                    </div>
                    <p className="mt-2 leading-relaxed text-muted">{r.comment}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {bundles.length ? (
        <section className="mt-16">
          <h2 className="mb-5 font-display text-3xl font-bold">Save with a bundle</h2>
          <ProductGrid products={bundles} />
        </section>
      ) : null}
      {related.length ? (
        <section className="mt-16">
          <h2 className="mb-5 font-display text-3xl font-bold">You might also like</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
