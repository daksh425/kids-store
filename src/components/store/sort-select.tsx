"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function SortSelect({ basePath, params, value }: { basePath: string; params: Record<string, string>; value: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm font-bold">
      <span className="text-muted">Sort</span>
      <select
        className="field !w-auto !rounded-full !py-1.5 pr-8 text-sm"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = new URLSearchParams({ ...params, sort: e.target.value });
          if (e.target.value === "popular") next.delete("sort");
          start(() => router.push(`${basePath}${next.size ? `?${next}` : ""}`, { scroll: false }));
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
