import { SearchX } from "lucide-react";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { AGE_GROUPS, CATEGORIES } from "@/lib/catalog";
import { listProducts, type ProductSort } from "@/lib/products";
import { SortSelect } from "./sort-select";

const SORTS: ProductSort[] = ["popular", "newest", "price-asc", "price-desc"];

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function parseCatalogParams(sp: Record<string, string | string[] | undefined>) {
  const age = first(sp.age);
  const sort = first(sp.sort) as ProductSort | undefined;
  return {
    age: AGE_GROUPS.some((a) => a.slug === age) ? age : undefined,
    sort: sort && SORTS.includes(sort) ? sort : "popular",
  } as { age?: string; sort: ProductSort };
}

function hrefWith(basePath: string, params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  return `${basePath}${q.size ? `?${q}` : ""}`;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`chip border-2 transition ${active ? "border-primary bg-primary text-white" : "border-line bg-white text-navy hover:border-primary/40"}`}
    >
      {children}
    </Link>
  );
}

export async function CatalogView({
  basePath,
  category,
  age,
  sort,
  showCategoryChips,
}: {
  basePath: string;
  category?: string;
  age?: string;
  sort: ProductSort;
  showCategoryChips?: boolean;
}) {
  const products = await listProducts({ category, ageGroup: age, sort });
  const keep = { age, sort: sort === "popular" ? undefined : sort };

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-card sm:p-5">
        {showCategoryChips ? (
          <div className="flex flex-wrap gap-2">
            <Chip href={hrefWith("/kids", keep)} active={!category}>
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.slug} href={hrefWith(`/kids/${c.slug}`, keep)} active={category === c.slug}>
                {c.short}
              </Chip>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-bold text-muted">Age</span>
            <Chip href={hrefWith(basePath, { ...keep, age: undefined })} active={!age}>
              Any age
            </Chip>
            {AGE_GROUPS.map((a) => (
              <Chip key={a.slug} href={hrefWith(basePath, { ...keep, age: a.slug })} active={age === a.slug}>
                {a.slug}
              </Chip>
            ))}
          </div>
          <SortSelect basePath={basePath} params={age ? { age } : {}} value={sort} />
        </div>
      </div>

      <p className="mt-6 mb-4 text-sm font-bold text-muted">
        {products.length} {products.length === 1 ? "resource" : "resources"}
      </p>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <SearchX size={40} className="text-muted" />
          <p className="mt-3 font-display text-xl font-semibold">{age ? "Nothing here for that age yet" : "No resources here yet"}</p>
          <p className="mt-1 text-muted">{age ? "Try another age group, or browse everything." : "New printables are on the way."}</p>
          <Link href={age ? basePath : "/kids"} className="btn btn-primary mt-5">
            {age ? "Clear filters" : "Browse all resources"}
          </Link>
        </div>
      )}
    </div>
  );
}
