import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="mb-6 font-display text-4xl font-bold">Your cart</h1>
      <CartView />
    </div>
  );
}
