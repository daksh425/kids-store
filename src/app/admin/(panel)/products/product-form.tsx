"use client";

import { FileText, Save } from "lucide-react";
import { useActionState, useState } from "react";
import { ALL_AGE_GROUPS, ALL_CATEGORIES } from "@/lib/catalog";
import { formatBytes, slugify } from "@/lib/format";
import { thumbnailUrl } from "@/lib/media";
import { saveProduct, type ProductFormState } from "../actions";

export type ProductFormValues = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  ageGroup: string;
  price: number;
  discountPrice: number | null;
  pages: number | null;
  format: string;
  includes: string[];
  featured: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  thumbnail: string | null;
  file: string | null;
  fileName: string | null;
  fileSize: number | null;
  sampleFile?: string | null;
};

export function ProductForm({ product }: { product: ProductFormValues }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const [title, setTitle] = useState(product.title);
  const [slug, setSlug] = useState(product.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(product.id));
  const [preview, setPreview] = useState<string | null>(thumbnailUrl(product.thumbnail));

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      {product.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="card space-y-5 p-5 sm:p-6">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            required
            className="field"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="slug">URL slug</label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted">/product/</span>
            <input
              id="slug"
              name="slug"
              className="field"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="shortDescription">Short description <span className="font-normal text-muted">(shown on cards and at the top of the page)</span></label>
          <input id="shortDescription" name="shortDescription" maxLength={200} className="field" defaultValue={product.shortDescription} />
        </div>
        <div>
          <label className="label" htmlFor="description">Full description</label>
          <textarea id="description" name="description" required rows={6} className="field" defaultValue={product.description} />
        </div>
        <div>
          <label className="label" htmlFor="includes">What&apos;s included <span className="font-normal text-muted">(one per line)</span></label>
          <textarea id="includes" name="includes" rows={4} className="field" defaultValue={product.includes.join("\n")} placeholder={"20 colouring pages\nPrintable A4 PDF"} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" name="category" className="field" defaultValue={product.category}>
              {ALL_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ageGroup">Age group</label>
            <select id="ageGroup" name="ageGroup" className="field" defaultValue={product.ageGroup}>
              {ALL_AGE_GROUPS.map((a) => (
                <option key={a.slug} value={a.slug}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="price">Price (₹) <span className="font-normal text-muted">0 = free resource</span></label>
            <input id="price" name="price" type="number" min={0} step={1} required className="field" defaultValue={product.price} />
          </div>
          <div>
            <label className="label" htmlFor="discountPrice">Sale price (₹) <span className="font-normal text-muted">optional</span></label>
            <input id="discountPrice" name="discountPrice" type="number" min={0} step={1} className="field" defaultValue={product.discountPrice ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="pages">Number of pages</label>
            <input id="pages" name="pages" type="number" min={0} className="field" defaultValue={product.pages ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="format">Format</label>
            <input id="format" name="format" className="field" defaultValue={product.format} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4 p-5">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" className="field" defaultValue={product.status}>
              <option value="DRAFT">Draft (hidden)</option>
              <option value="PUBLISHED">Published (on sale)</option>
              <option value="ARCHIVED">Archived (hidden, kept for orders)</option>
            </select>
          </div>
          <label className="flex items-center gap-2.5 font-bold">
            <input type="checkbox" name="featured" defaultChecked={product.featured} className="size-5 accent-primary" />
            Featured (boosts it in best sellers)
          </label>
          {state.error ? <p role="alert" className="rounded-xl bg-coral-50 p-3 text-sm font-bold text-coral-ink">{state.error}</p> : null}
          <button className="btn btn-primary w-full" disabled={pending}>
            <Save size={18} /> {pending ? "Saving…" : "Save product"}
          </button>
        </div>

        <div className="card space-y-3 p-5">
          <p className="label !mb-0">Product file (PDF or ZIP)</p>
          {product.file ? (
            <p className="flex items-center gap-2 rounded-xl bg-cream p-3 text-sm">
              <FileText size={18} className="shrink-0 text-primary" />
              <span className="min-w-0 truncate">{product.fileName ?? product.file}</span>
              <span className="ml-auto shrink-0 text-muted">{formatBytes(product.fileSize)}</span>
            </p>
          ) : (
            <p className="text-sm text-muted">No file yet. Required before publishing.</p>
          )}
          <input name="file" type="file" accept=".pdf,.zip,application/pdf,application/zip" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-bold file:text-primary" />
          <p className="text-xs text-muted">Stored privately. Customers only get it through expiring download links.</p>
        </div>

        <div className="card space-y-3 p-5">
          <p className="label !mb-0">Free sample PDF <span className="font-normal text-muted">(optional)</span></p>
          <p className="text-xs text-muted">e.g. the first chapter. Anyone can read it as a book at /sample/{product.slug || "your-slug"}, no purchase needed.</p>
          {product.sampleFile ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="removeSample" className="size-4 accent-primary" /> Remove the current sample
            </label>
          ) : null}
          <input name="sample" type="file" accept=".pdf,application/pdf" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-bold file:text-primary" />
        </div>

        <div className="card space-y-3 p-5">
          <p className="label !mb-0">Cover / thumbnail</p>
          <div className="mx-auto aspect-[3/4] w-40 overflow-hidden rounded-2xl bg-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <input
            name="thumbnail"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-bold file:text-primary"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
          <p className="text-xs text-muted">Portrait 3:4 works best, e.g. 900×1200. PNG, JPG, WebP or SVG.</p>
        </div>
      </div>
    </form>
  );
}
