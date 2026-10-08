"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { requestLoginLink, type LinkState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LinkState, FormData>(requestLoginLink, {});

  if (state.sent) {
    return (
      <div className="rounded-2xl bg-mint-50 p-5">
        <p className="flex items-center gap-2 font-bold text-mint-ink">
          <MailCheck size={20} /> Check your inbox
        </p>
        <p className="mt-1 text-sm text-muted">If we have orders for that email, a sign-in link is on its way. It works for 30 minutes.</p>
        {state.devLink ? (
          <p className="mt-3 rounded-xl border-2 border-dashed border-secondary bg-white p-3 text-sm">
            <strong>Local dev:</strong> email isn&apos;t configured, so here&apos;s the link:{" "}
            <a href={state.devLink} className="font-bold break-all text-primary underline">
              open sign-in link
            </a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action}>
      <div className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="orders-email" className="sr-only">
        Email
      </label>
      <input id="orders-email" name="email" type="email" required placeholder="Email you used at checkout" className="field" autoComplete="email" />
      <button className="btn btn-primary shrink-0" disabled={pending}>
        {pending ? "Sending…" : "Email me a link"}
      </button>
      </div>
      {state.error ? <p className="mt-2 text-sm font-bold text-coral-ink">{state.error}</p> : null}
    </form>
  );
}
