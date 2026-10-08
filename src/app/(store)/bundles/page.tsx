import { PiggyBank } from "lucide-react";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-card";
import { inr } from "@/lib/format";
import { effectivePrice } from "@/lib/pricing";
import { listProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Bundles",
  description: "Learning packs that combine e-books, worksheets and activities by age, for less.",
};

export default async function BundlesPage() {
  const bundles = await listProducts({ category: "learning-packs", sort: "price-asc" });
  const bestSaving = Math.max(0, ...bundles.map((b) => b.price - effectivePrice(b)));
  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-5 rounded-[2rem] bg-primary p-6 text-white sm:flex-row sm:items-center sm:p-10">
        <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-white/15 text-sunny">
          <PiggyBank size={32} />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Bundle &amp; save</h1>
          <p className="mt-2 max-w-2xl text-lg text-white/85">
            Learning packs bring together activities, worksheets and colouring for one age group in a single download
            {bestSaving > 0 ? `, saving up to ${inr(bestSaving)}` : ""}.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <ProductGrid products={bundles} />
      </div>
    </div>
  );
}
