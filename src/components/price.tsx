import { inr } from "@/lib/format";
import { discountPercent, effectivePrice } from "@/lib/pricing";

export function Price({
  price,
  discountPrice,
  size = "md",
}: {
  price: number;
  discountPrice: number | null;
  size?: "md" | "lg";
}) {
  const now = effectivePrice({ price, discountPrice });
  const off = discountPercent({ price, discountPrice });
  const big = size === "lg";
  if (now === 0) {
    return <span className={`font-display font-bold text-mint-ink ${big ? "text-3xl" : "text-lg"}`}>Free</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`font-display font-bold text-navy ${big ? "text-3xl" : "text-lg"}`}>{inr(now)}</span>
      {off > 0 ? (
        <>
          <s className={`text-muted ${big ? "text-lg" : "text-sm"}`}>{inr(price)}</s>
          <span className={`font-bold text-coral-ink ${big ? "text-base" : "text-xs"}`}>{off}% off</span>
        </>
      ) : null}
    </span>
  );
}
