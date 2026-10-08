import type { Metadata } from "next";
import { CatalogView, parseCatalogParams } from "@/components/store/catalog-view";

export const metadata: Metadata = {
  title: "Kids resources",
  description: "Printable kids e-books, colouring books, activity books, worksheets and learning packs for ages 2–12.",
};

export default async function KidsPage({ searchParams }: PageProps<"/kids">) {
  const { age, sort } = parseCatalogParams(await searchParams);
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Kids resources</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">
        Printable e-books, colouring, activities, worksheets and learning packs. Filter by age to find the right fit.
      </p>
      <div className="mt-8">
        <CatalogView basePath="/kids" age={age} sort={sort} showCategoryChips />
      </div>
    </div>
  );
}
