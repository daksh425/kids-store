import type { Metadata } from "next";
import { LogoMark } from "@/components/icons";
import { STORE_NAME } from "@/lib/catalog";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <main className="grid flex-1 place-items-center p-4">
      <div className="card w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-2">
          <LogoMark className="size-9" />
          <div>
            <p className="font-display text-xl font-bold">{STORE_NAME}</p>
            <p className="text-sm text-muted">Admin dashboard</p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-4 text-xs text-muted">The password is the ADMIN_PASSWORD value in your .env file.</p>
      </div>
    </main>
  );
}
