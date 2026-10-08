"use client";

import { CircleAlert, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CouponField, MiniItem, SummaryLines } from "@/components/store/order-summary";
import { getSavedCoupon, saveCoupon, useCart, useHydrated } from "@/lib/client/cart";
import { useQuote } from "@/lib/client/quote";
import { track } from "@/lib/client/track";
import { inr } from "@/lib/format";

type PayResult = {
  kind: "pay";
  orderId: string;
  mode: "razorpay" | "demo";
  razorpayOrderId: string;
  amountPaise: number;
  keyId: string;
  storeName: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};
type CreateResult = { kind: "error"; error: string } | { kind: "paid"; orderId: string } | PayResult;

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: (r: { error?: { description?: string } }) => void): void };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json() as Promise<T>;
}

export function CheckoutView({ buyId, mode }: { buyId: string | null; mode: "razorpay" | "demo" | "unconfigured" }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = useCart();
  // Buy-now skips the cart's saved coupon. Safe to read here: a skeleton renders until hydration.
  const [coupon, setCoupon] = useState(() => (buyId ? "" : getSavedCoupon()));

  const productIds = hydrated ? (buyId ? [buyId] : cart.items.map((i) => i.id)) : null;
  const { quote, loading } = useQuote(productIds, coupon);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState<PayResult | null>(null);

  const tracked = useRef(false);
  useEffect(() => {
    if (quote && quote.items.length && !tracked.current) {
      tracked.current = true;
      track("checkout_start", buyId ?? undefined, { currency: "INR", value: quote.total });
    }
  }, [quote, buyId]);

  const finish = (orderId: string) => {
    if (buyId) cart.remove(buyId);
    else {
      cart.clear();
      saveCoupon("");
    }
    router.push(`/order/${orderId}?welcome=1`);
  };

  const verify = async (orderId: string, r: RazorpaySuccess) => {
    setBusy(true);
    const res = await post<{ ok: boolean; error?: string }>("/api/checkout/verify", { orderId, ...r }).catch(() => ({ ok: false, error: undefined }));
    if (res.ok) finish(orderId);
    else {
      setBusy(false);
      setError(res.error ?? "We couldn't confirm your payment. If money left your account, contact us with your order details.");
    }
  };

  const reportFailure = (orderId: string, reason: string) => {
    void post("/api/checkout/failed", { orderId, reason }).catch(() => {});
  };

  const openRazorpay = async (r: PayResult) => {
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setBusy(false);
      setError("Couldn't load the payment window. Check your connection and try again.");
      return;
    }
    const rzp = new window.Razorpay({
      key: r.keyId,
      amount: r.amountPaise,
      currency: "INR",
      name: r.storeName,
      description: r.description,
      order_id: r.razorpayOrderId,
      prefill: r.prefill,
      theme: { color: "#D02B65" },
      handler: (resp: RazorpaySuccess) => verify(r.orderId, resp),
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", (resp) => {
      const reason = resp.error?.description ?? "Payment failed";
      reportFailure(r.orderId, reason);
      setError(`${reason}. You can try again.`);
    });
    rzp.open();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;
    setError(null);
    setBusy(true);
    const result = await post<CreateResult>("/api/checkout/create-order", {
      ...form,
      phone: form.phone || null,
      productIds: quote.items.map((i) => i.id),
      couponCode: quote.coupon?.ok ? quote.coupon.code : null,
    }).catch(() => ({ kind: "error" as const, error: "Network error. Please try again." }));

    if (result.kind === "error") {
      setBusy(false);
      setError(result.error);
    } else if (result.kind === "paid") {
      finish(result.orderId);
    } else if (result.mode === "demo") {
      setDemo(result);
    } else {
      await openRazorpay(result);
    }
  };

  if (!hydrated || (loading && !quote)) return <div className="card h-80 animate-pulse" aria-busy="true" />;

  if (!quote || quote.items.length === 0) {
    return (
      <div className="card px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-semibold">{buyId ? "That product isn't available" : "Your cart is empty"}</h2>
        <Link href="/kids" className="btn btn-primary mt-5">
          Browse resources
        </Link>
      </div>
    );
  }

  const free = quote.total === 0;
  const blocked = !free && mode === "unconfigured";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <form onSubmit={submit} className="card space-y-5 p-5 sm:p-7">
        <div>
          <h2 className="font-display text-2xl font-semibold">Your details</h2>
          <p className="mt-1 text-sm text-muted">We&apos;ll email your download link{quote.items.length > 1 ? "s" : ""} here. No account needed.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Parent&apos;s name
            </label>
            <input id="name" className="field" required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="field" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="phone" type="tel" className="field" autoComplete="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        {mode === "demo" && !free ? (
          <div className="flex gap-3 rounded-2xl border-2 border-dashed border-secondary bg-secondary-50 p-4 text-sm">
            <FlaskConical size={20} className="mt-0.5 shrink-0 text-[#1F65B8]" />
            <p>
              <strong>Demo payment mode.</strong> No Razorpay keys are set in <code>.env</code>, so a simulated payment screen opens instead.
              Add your Razorpay <em>Test Mode</em> keys to use real Razorpay Checkout.
            </p>
          </div>
        ) : null}
        {blocked ? (
          <p className="rounded-2xl bg-coral-50 p-4 text-sm font-bold text-coral-ink">Payments are not set up yet. Please check back soon.</p>
        ) : null}
        {error ? (
          <p role="alert" className="flex gap-2 rounded-2xl bg-coral-50 p-4 text-sm font-bold text-coral-ink">
            <CircleAlert size={18} className="mt-0.5 shrink-0" /> {error}
          </p>
        ) : null}

        <button className="btn btn-lg btn-primary w-full" disabled={busy || blocked}>
          {busy ? "Please wait…" : free ? "Get my free download" : <><Lock size={18} /> Pay {inr(quote.total)} securely</>}
        </button>
        <p className="flex items-center justify-center gap-2 text-xs font-bold text-muted">
          <ShieldCheck size={15} /> {free ? "We'll only use your email to send your download." : "Payments are processed by Razorpay. We never see your card details."}
        </p>
      </form>

      <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-semibold">Order summary</h2>
        <div className="space-y-4">
          {quote.items.map((item) => (
            <MiniItem key={item.id} item={item} />
          ))}
        </div>
        {free && !quote.coupon ? null : (
          <CouponField
            key={coupon}
            code={coupon}
            onApply={(c) => {
              setCoupon(c);
              if (!buyId) saveCoupon(c);
            }}
            error={quote.coupon && !quote.coupon.ok ? quote.coupon.error : undefined}
          />
        )}
        <SummaryLines quote={quote} />
      </aside>

      {demo ? (
        <DemoPayment
          result={demo}
          onClose={() => {
            setDemo(null);
            setBusy(false);
          }}
          onFail={() => {
            reportFailure(demo.orderId, "Simulated payment failure");
            setDemo(null);
            setBusy(false);
            setError("The (simulated) payment failed. You can try again.");
          }}
          onSuccess={async () => {
            const r = await post<RazorpaySuccess & { error?: string }>("/api/checkout/demo-pay", { orderId: demo.orderId });
            setDemo(null);
            if (r.error) {
              setBusy(false);
              setError(r.error);
            } else await verify(demo.orderId, r);
          }}
        />
      ) : null}
    </div>
  );
}

function DemoPayment({ result, onClose, onFail, onSuccess }: { result: PayResult; onClose: () => void; onFail: () => void; onSuccess: () => void }) {
  const [paying, setPaying] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-4" role="dialog" aria-modal="true" aria-label="Demo payment">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-primary p-5 text-white">
          <p className="text-xs font-extrabold tracking-wider text-sunny uppercase">Demo checkout · no real money</p>
          <p className="mt-1 font-display text-xl font-semibold">{result.storeName}</p>
          <p className="text-sm text-white/80">{result.description}</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-muted">Amount</span>
            <span className="font-display text-3xl font-bold">{inr(result.amountPaise / 100)}</span>
          </div>
          <p className="rounded-2xl bg-cream p-3 text-xs text-muted">
            This stands in for Razorpay Checkout. Your order <code>{result.razorpayOrderId}</code> goes through the same server-side signature
            check that a real payment does.
          </p>
          <button
            type="button"
            className="btn btn-lg btn-primary w-full"
            disabled={paying}
            onClick={() => {
              setPaying(true);
              onSuccess();
            }}
          >
            {paying ? "Processing…" : "Simulate successful payment"}
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline flex-1" disabled={paying} onClick={onFail}>
              Simulate failure
            </button>
            <button type="button" className="btn btn-ghost flex-1" disabled={paying} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
