"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { PropertySortOption } from "@/types";

export function SortSelect({ current }: { current: PropertySortOption }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
    >
      <option value="newest">Terbaru</option>
      <option value="price_asc">Harga Terendah</option>
      <option value="price_desc">Harga Tertinggi</option>
      <option value="rating_desc">Rating Tertinggi</option>
      <option value="most_reviewed">Terbanyak Diulas</option>
    </select>
  );
}
