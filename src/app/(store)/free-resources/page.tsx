import { Gift, Mail, Printer } from "lucide-react";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/product-card";
import { listProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Free resources",
  description: "Free printable colouring pages, activities and worksheets for kids.",
};

export default async function FreeResourcesPage() {
  const products = await listProducts({ free: true, sort: "newest" });
  return (
    <div className="container-page py-10">
      <div className="rounded-[2rem] bg-sunny-50 p-6 sm:p-10">
        <p className="chip bg-white text-[#8A6400] shadow-card">
          <Gift size={16} /> 100% free
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Free printables</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted">
          Try our activities before you buy. Pick a freebie, enter your email, and download it straight away.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
          <li className="flex items-center gap-2">
            <Mail size={16} className="text-primary" /> No payment, just your email
          </li>
          <li className="flex items-center gap-2">
            <Printer size={16} className="text-primary" /> Print as often as you like
          </li>
        </ul>
      </div>
      <div className="mt-8">
        {products.length ? <ProductGrid products={products} /> : <p className="text-muted">New free resources are coming soon.</p>}
      </div>
    </div>
  );
}
