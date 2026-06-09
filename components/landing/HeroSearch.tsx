"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { RentPeriod } from "@/types";

interface Category {
  id: number;
  name: string;
}

export function HeroSearch({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"sale" | "rent">("sale");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [rentPeriod, setRentPeriod] = useState<RentPeriod>("month");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("listing_type", tab);
    if (location) params.set("search", location);
    if (categoryId) params.set("category_id", categoryId);
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);
    if (tab === "rent") params.set("rent_period", rentPeriod);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex rounded-t-xl overflow-hidden">
        {(["sale", "rent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-primary text-white"
                : "bg-white/90 text-gray-600 hover:bg-white"
            }`}
          >
            {t === "sale" ? "Beli" : "Sewa"}
          </button>
        ))}
      </div>
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-b-xl shadow-2xl p-4 sm:p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lokasi (kota, kecamatan...)"
            className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary bg-white"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Harga minimum"
            className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary font-mono"
          />
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Harga maksimum"
            className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary font-mono"
          />
          {tab === "rent" && (
            <select
              value={rentPeriod}
              onChange={(e) => setRentPeriod(e.target.value as RentPeriod)}
              className="sm:col-span-2 rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary bg-white"
            >
              <option value="day">Per Hari</option>
              <option value="month">Per Bulan</option>
              <option value="year">Per Tahun</option>
            </select>
          )}
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-semibold text-white hover:bg-secondary/90 transition-colors"
        >
          <Search className="h-4 w-4" />
          Cari Properti
        </button>
      </form>
    </div>
  );
}
