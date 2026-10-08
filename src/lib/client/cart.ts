"use client";

import { useSyncExternalStore } from "react";

// The cart lives in localStorage: it holds which products, nothing more
// authoritative. Prices shown at checkout are re-quoted by the server.

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  thumbnail: string | null;
  category: string;
};

const CART_KEY = "ks_cart_v1";
const COUPON_KEY = "ks_coupon_v1";
const EMPTY: CartItem[] = [];

const listeners = new Set<() => void>();
let snapshot: CartItem[] | null = null;

function read(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  snapshot = items;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Private mode or storage full: the cart still works for this page view.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_KEY) {
      snapshot = read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  snapshot ??= read();
  return snapshot;
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  return {
    items,
    count: items.length,
    has: (id: string) => items.some((i) => i.id === id),
    add: (item: CartItem) => {
      const current = getSnapshot();
      if (!current.some((i) => i.id === item.id)) write([...current, item]);
    },
    remove: (id: string) => write(getSnapshot().filter((i) => i.id !== id)),
    removeMany: (ids: string[]) => write(getSnapshot().filter((i) => !ids.includes(i.id))),
    clear: () => write([]),
  };
}

export function getSavedCoupon() {
  try {
    return localStorage.getItem(COUPON_KEY) || "";
  } catch {
    return "";
  }
}

export function saveCoupon(code: string) {
  try {
    if (code) localStorage.setItem(COUPON_KEY, code);
    else localStorage.removeItem(COUPON_KEY);
  } catch {}
}

const noop = () => () => {};
/** False during SSR and the hydration pass, true after: avoids flashing an empty cart. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
