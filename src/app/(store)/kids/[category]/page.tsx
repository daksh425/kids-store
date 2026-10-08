import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/components/icons";
import { CatalogView, parseCatalogParams } from "@/components/store/catalog-view";
import { CATEGORIES, getCategory } from "@/lib/catalog";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kids/[category]">): Promise<Metadata> {
  const category = getCategory((await params).category);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/kids/[category]">) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  const { age, sort } = parseCatalogParams(await searchParams);

  return (
    <div className="container-page py-10">
      <div className="flex flex-col gap-5 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:p-8" style={{ background: category.tint }}>
        <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-white shadow-card" style={{ color: category.ink }}>
          <CategoryIcon slug={category.slug} size={32} />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold">{category.name}</h1>
          <p className="mt-1 text-lg text-muted">{category.description}</p>
        </div>
      </div>
      <div className="mt-6">
        <CatalogView basePath={`/kids/${category.slug}`} category={category.slug} age={age} sort={sort} showCategoryChips />
      </div>
    </div>
  );
}
