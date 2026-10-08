"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { createCoupon, type CouponFormState } from "../actions";

export function CouponForm() {
  const [state, action, pending] = useActionState<CouponFormState, FormData>(createCoupon, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      <div className="lg:col-span-1">
        <label className="label" htmlFor="code">Code</label>
        <input id="code" name="code" required className="field uppercase" placeholder="DIWALI20" />
      </div>
      <div>
        <label className="label" htmlFor="type">Type</label>
        <select id="type" name="type" className="field">
          <option value="PERCENT">% off</option>
          <option value="FLAT">₹ off</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="value">Discount</label>
        <input id="value" name="value" type="number" min={1} required className="field" placeholder="20" />
      </div>
      <div>
        <label className="label" htmlFor="minOrder">Min order ₹</label>
        <input id="minOrder" name="minOrder" type="number" min={0} defaultValue={0} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="maxUses">Max uses</label>
        <input id="maxUses" name="maxUses" type="number" min={1} className="field" placeholder="Unlimited" />
      </div>
      <div>
        <label className="label" htmlFor="expiresAt">Expires</label>
        <input id="expiresAt" name="expiresAt" type="date" className="field" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-6">
        <button className="btn btn-primary" disabled={pending}>
          <Plus size={18} /> {pending ? "Creating…" : "Create coupon"}
        </button>
        {state.error ? <p className="text-sm font-bold text-coral-ink">{state.error}</p> : null}
        {state.ok ? <p className="text-sm font-bold text-mint-ink">Coupon created.</p> : null}
      </div>
    </form>
  );
}
