import Link from "next/link";
import { ageLabel, getCategory } from "@/lib/catalog";
import { thumbnailUrl } from "@/lib/media";
import { effectivePrice } from "@/lib/pricing";
import type { ProductCardData } from "@/lib/products";
import { AddToCartButton } from "./add-to-cart-button";
import { Price } from "./price";
import { Stars } from "./stars";

export function ProductCard({ product }: { product: ProductCardData }) {
  const category = getCategory(product.category);
  const thumb = thumbnailUrl(product.thumbnail);
  const href = `/product/${product.slug}`;
  const free = effectivePrice(product) === 0;

  return (
    <article className="group card relative flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <Link href={href} className="block aspect-[3/4] overflow-hidden" style={{ background: category?.tint }} tabIndex={-1} aria-hidden="true">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {category ? (
            <span className="rounded-full px-2 py-0.5" style={{ background: category.tint, color: category.ink }}>
              {category.short}
            </span>
          ) : null}
          <span className="rounded-full bg-cream-dark px-2 py-0.5 text-muted">{ageLabel(product.ageGroup)}</span>
        </div>
        <h3 className="font-display text-lg leading-snug font-semibold">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {product.title}
          </Link>
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          {product.reviewCount > 0 && product.rating ? (
            <>
              <Stars rating={product.rating} size={14} />
              <span>({product.reviewCount})</span>
            </>
          ) : (
            <span>{product.pages ? `${product.pages} printable pages` : "Printable PDF"}</span>
          )}
        </div>
        <div className="mt-auto pt-1">
          <Price price={product.price} discountPrice={product.discountPrice} />
          <div className="relative z-10 mt-3 flex items-center gap-1.5">
            <Link href={href} className="btn btn-sm btn-primary flex-1">
              {free ? "Get it free" : "View product"}
            </Link>
            {free ? null : (
              <AddToCartButton
                variant="icon"
                item={{
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  price: effectivePrice(product),
                  thumbnail: product.thumbnail,
                  category: product.category,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
