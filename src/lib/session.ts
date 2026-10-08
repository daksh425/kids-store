import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isProduction, sessionSecret } from "./config";

// Signed cookies (value.hmac). Three are used:
//   ks_admin     admin dashboard session
//   ks_customer  customer signed in by email link: sees full order history
//   ks_orders    orders placed from this browser, so the buyer can reach their
//                download page without signing in. Deliberately not tied to the
//                email typed at checkout, which proves nothing about identity.

const ADMIN_COOKIE = "ks_admin";
const CUSTOMER_COOKIE = "ks_customer";
const ORDERS_COOKIE = "ks_orders";

const DAY = 24 * 60 * 60;

function hmac(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function sign(value: string) {
  return `${value}.${hmac(value)}`;
}

export function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const given = Buffer.from(signed.slice(i + 1));
  const expected = Buffer.from(hmac(value));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return value;
}

function cookieOptions(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: isProduction, path: "/", maxAge };
}

/** value|expiresAtSeconds, so a stolen-then-replayed old cookie stops working */
function readExpiring(raw: string | undefined) {
  const value = unsign(raw);
  if (!value) return null;
  const [subject, exp] = value.split("|");
  if (!subject || !exp || Number(exp) * 1000 < Date.now()) return null;
  return subject;
}

function expiring(subject: string, maxAge: number) {
  return sign(`${subject}|${Math.floor(Date.now() / 1000) + maxAge}`);
}

// ---------- admin ----------

export async function isAdmin() {
  // Expiry compares against the clock, which must be read per request, not at prerender.
  await connection();
  const store = await cookies();
  return readExpiring(store.get(ADMIN_COOKIE)?.value) === "admin";
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function startAdminSession() {
  const maxAge = 7 * DAY;
  (await cookies()).set(ADMIN_COOKIE, expiring("admin", maxAge), cookieOptions(maxAge));
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export function checkAdminPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(hmac(input));
  const b = Buffer.from(hmac(expected));
  return timingSafeEqual(a, b);
}

// ---------- customer ----------

export async function getCustomerId() {
  await connection();
  return readExpiring((await cookies()).get(CUSTOMER_COOKIE)?.value);
}

export async function startCustomerSession(userId: string) {
  const maxAge = 30 * DAY;
  (await cookies()).set(CUSTOMER_COOKIE, expiring(userId, maxAge), cookieOptions(maxAge));
}

export async function endCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
  store.delete(ORDERS_COOKIE);
}

// ---------- orders placed in this browser ----------

export async function getBrowserOrderIds(): Promise<string[]> {
  const value = unsign((await cookies()).get(ORDERS_COOKIE)?.value);
  return value ? value.split(",").filter(Boolean) : [];
}

export async function rememberBrowserOrder(orderId: string) {
  const ids = [orderId, ...(await getBrowserOrderIds()).filter((id) => id !== orderId)].slice(0, 25);
  (await cookies()).set(ORDERS_COOKIE, sign(ids.join(",")), cookieOptions(180 * DAY));
}
