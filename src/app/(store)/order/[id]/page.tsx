import { CircleAlert, Clock, Download, Mail, PartyPopper, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/catalog";
import { canSeeOrder, getViewer } from "@/lib/customer";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, inr, orderLabel } from "@/lib/format";
import { thumbnailUrl } from "@/lib/media";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const NOTICES: Record<string, string> = {
  expired: "That download link has expired. Contact us and we'll happily renew it.",
  limit: "That file has reached its download limit. Contact us if you need it again.",
  missing: "That file is temporarily unavailable. We've been notified; please try again later or contact us.",
};

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [order, viewer] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: { user: true, items: true, downloads: { include: { product: true } } },
    }),
    getViewer(),
  ]);
  if (!order) notFound();

  if (!canSeeOrder(viewer, order)) {
    return (
      <div className="container-page max-w-xl py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Sign in to see this order</h1>
        <p className="mt-2 text-muted">For your privacy, orders open only in the browser that placed them, or after you sign in with your email.</p>
        <Link href="/orders" className="btn btn-primary mt-6">
          Get a sign-in link
        </Link>
      </div>
    );
  }

  const notice = typeof sp.download === "string" ? NOTICES[sp.download] : undefined;
  const welcome = sp.welcome === "1" && order.status === "PAID";
  const now = new Date();

  return (
    <div className="container-page max-w-3xl py-10">
      {order.status === "PAID" ? (
        <div className="rounded-[2rem] bg-mint-50 p-6 sm:p-8">
          <PartyPopper size={36} className="text-mint-ink" />
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            {welcome ? `Thank you, ${order.user.name.split(" ")[0]}!` : "Your downloads"}
          </h1>
          <p className="mt-2 text-lg text-muted">
            {welcome ? "Your files are ready to download right now." : "Everything from this order, ready to download."}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-mint-ink">
            <Mail size={16} /> We&apos;ve also emailed the links to {order.user.email}
          </p>
        </div>
      ) : order.status === "CREATED" ? (
        <div className="rounded-[2rem] bg-sunny-50 p-6 sm:p-8">
          <Clock size={32} className="text-[#8A6400]" />
          <h1 className="mt-3 font-display text-3xl font-bold">Waiting for payment</h1>
          <p className="mt-2 text-muted">
            We haven&apos;t received confirmation of payment for this order yet. If you completed payment, this page will update shortly. Refresh in a minute.
          </p>
        </div>
      ) : (
        <div className="rounded-[2rem] bg-coral-50 p-6 sm:p-8">
          <CircleAlert size={32} className="text-coral-ink" />
          <h1 className="mt-3 font-display text-3xl font-bold">Payment didn&apos;t go through</h1>
          <p className="mt-2 text-muted">{order.failureReason ?? "The payment was not completed."} No money was taken for this order.</p>
          <Link href="/cart" className="btn btn-primary mt-5">
            Try again
          </Link>
        </div>
      )}

      {notice ? (
        <p role="alert" className="mt-6 flex gap-2 rounded-2xl bg-coral-50 p-4 font-bold text-coral-ink">
          <CircleAlert size={20} className="shrink-0" /> {notice}
        </p>
      ) : null}

      {order.status === "PAID" ? (
        <ul className="mt-6 space-y-3">
          {order.downloads.map((d) => {
            const category = getCategory(d.product.category);
            const thumb = thumbnailUrl(d.product.thumbnail);
            const left = d.maxDownloads - d.downloadCount;
            const expired = d.expiresAt < now;
            const usable = !expired && left > 0;
            return (
              <li key={d.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex flex-1 items-center gap-4">
                  <div className="h-24 w-18 shrink-0 overflow-hidden rounded-2xl" style={{ background: category?.tint }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold">{d.product.title}</p>
                    <p className="text-sm text-muted">
                      {expired ? "Link expired" : `${left} of ${d.maxDownloads} downloads left · until ${formatDate(d.expiresAt)}`}
                    </p>
                    <Link href={`/product/${d.product.slug}#reviews`} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                      <Star size={14} /> Leave a review
                    </Link>
                  </div>
                </div>
                {usable ? (
                  <a href={`/download/${d.downloadToken}`} className="btn btn-primary shrink-0">
                    <Download size={18} /> Download PDF
                  </a>
                ) : (
                  <Link href="/contact" className="btn btn-outline shrink-0">
                    Ask us to renew
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="card mt-6 p-5 text-sm">
        <h2 className="font-display text-lg font-semibold">Order {orderLabel(order.number)}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2">
          <dt className="text-muted">Placed</dt>
          <dd className="text-right">{formatDateTime(order.createdAt)}</dd>
          {order.items.map((i) => (
            <div key={i.id} className="col-span-2 flex justify-between">
              <dt className="text-muted">{i.title}</dt>
              <dd>{i.price === 0 ? "Free" : inr(i.price)}</dd>
            </div>
          ))}
          {order.discount > 0 ? (
            <>
              <dt className="text-muted">Coupon {order.couponCode}</dt>
              <dd className="text-right text-mint-ink">−{inr(order.discount)}</dd>
            </>
          ) : null}
          <dt className="font-bold">Total</dt>
          <dd className="text-right font-bold">{order.amount === 0 ? "Free" : inr(order.amount)}</dd>
          {order.razorpayPaymentId ? (
            <>
              <dt className="text-muted">Payment ID</dt>
              <dd className="truncate text-right font-mono text-xs">{order.razorpayPaymentId}</dd>
            </>
          ) : null}
        </dl>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Find this order any time in{" "}
        <Link href="/orders" className="font-bold text-primary hover:underline">
          My orders
        </Link>
        .
      </p>
    </div>
  );
}
