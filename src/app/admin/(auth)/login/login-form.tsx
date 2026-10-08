"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">
          Admin password
        </label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="field" />
      </div>
      {state.error ? <p className="text-sm font-bold text-coral-ink">{state.error}</p> : null}
      <button className="btn btn-primary w-full" disabled={pending}>
        <Lock size={16} /> {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
