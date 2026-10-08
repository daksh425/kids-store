import type { Metadata } from "next";
import { paymentMode } from "@/lib/config";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const buy = (await searchParams).buy;
  return (
    <div className="container-page py-10">
      <h1 className="mb-6 font-display text-4xl font-bold">Checkout</h1>
      <CheckoutView buyId={typeof buy === "string" ? buy : null} mode={paymentMode()} />
    </div>
  );
}
