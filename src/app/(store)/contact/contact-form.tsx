"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { sendMessage, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, {});
  if (state.ok) {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <CheckCircle2 size={40} className="text-mint-ink" />
        <p className="mt-3 font-display text-2xl font-semibold">Message sent!</p>
        <p className="mt-1 text-muted">Thanks for getting in touch. We usually reply within one working day.</p>
      </div>
    );
  }
  return (
    <form action={action} className="card space-y-4 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required className="field" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required className="field" autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" required rows={5} className="field" placeholder="Include your order number if it's about a purchase." />
      </div>
      {state.error ? <p className="text-sm font-bold text-coral-ink">{state.error}</p> : null}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
