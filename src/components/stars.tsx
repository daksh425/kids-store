import { Star } from "lucide-react";

export function Stars({ rating, size = 16, className = "" }: { rating: number; size?: number; className?: string }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i <= rounded ? "fill-sunny text-[#E0B42C]" : i - 0.5 === rounded ? "fill-sunny/50 text-[#E0B42C]" : "fill-transparent text-navy/25"}
        />
      ))}
    </span>
  );
}
