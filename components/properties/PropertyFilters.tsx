"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { CertificateType, ListingType } from "@/types";

interface FilterProps {
  categories: { id: number; name: string }[];
  locations: { province: string; city: string; district: string }[];
  showAllStatus?: boolean;
}

export function PropertyFilters({ categories, locations, showAllStatus }: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listingType, setListingType] = useState<ListingType | "">(
    (searchParams.get("listing_type") as ListingType) ?? "",
  );

  const provinces = [...new Set(locations.map((l) => l.province))];
  const selectedProvince = searchParams.get("province") ?? "";
  const cities = [...new Set(
    locations.filter((l) => !selectedProvince || l.province === selectedProvince).map((l) => l.city),
  )];
  const selectedCity = searchParams.get("city") ?? "";
  const districts = locations
    .filter((l) => (!selectedProvince || l.province === selectedProvince) && (!selectedCity || l.city === selectedCity))
    .map((l) => l.district);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/properties?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-5">
      <h2 className="font-semibold text-gray-900">Filter</h2>

      <div>
        <label className="text-sm font-medium text-gray-700">Tipe Transaksi</label>
        <div className="flex gap-2 mt-2">
          {(["sale", "rent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setListingType(t);
                updateParams("listing_type", t);
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-medium border transition-colors ${
                listingType === t
                  ? "bg-primary text-white border-primary"
                  : "border-gray-200 text-gray-600 hover:border-primary"
              }`}
            >
              {t === "sale" ? "Beli" : "Sewa"}
            </button>
          ))}
        </div>
      </div>

      {listingType === "rent" && (
        <div>
          <label className="text-sm font-medium text-gray-700">Periode Sewa</label>
          <select
            defaultValue={searchParams.get("rent_period") ?? ""}
            onChange={(e) => updateParams("rent_period", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">Semua</option>
            <option value="day">Per Hari</option>
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700">Kategori</label>
        <select
          defaultValue={searchParams.get("category_id") ?? ""}
          onChange={(e) => updateParams("category_id", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">Semua</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Harga (Rp)</label>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">Harga jual & sewa menggunakan kolom yang sama</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={searchParams.get("price_min") ?? ""}
            onBlur={(e) => updateParams("price_min", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={searchParams.get("price_max") ?? ""}
            onBlur={(e) => updateParams("price_max", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Provinsi</label>
        <select
          defaultValue={selectedProvince}
          onChange={(e) => {
            updateParams("province", e.target.value);
            updateParams("city", "");
            updateParams("district", "");
          }}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">Semua</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {selectedProvince && (
        <div>
          <label className="text-sm font-medium text-gray-700">Kota</label>
          <select
            defaultValue={selectedCity}
            onChange={(e) => {
              updateParams("city", e.target.value);
              updateParams("district", "");
            }}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">Semua</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {selectedCity && (
        <div>
          <label className="text-sm font-medium text-gray-700">Kecamatan</label>
          <select
            defaultValue={searchParams.get("district") ?? ""}
            onChange={(e) => updateParams("district", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">Semua</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Kamar Tidur</label>
          <input
            type="number"
            min={0}
            defaultValue={searchParams.get("bedrooms_min") ?? ""}
            onBlur={(e) => updateParams("bedrooms_min", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Kamar Mandi</label>
          <input
            type="number"
            min={0}
            defaultValue={searchParams.get("bathrooms_min") ?? ""}
            onBlur={(e) => updateParams("bathrooms_min", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Tipe Sertifikat</label>
        <select
          defaultValue={searchParams.get("certificate_type") ?? ""}
          onChange={(e) => updateParams("certificate_type", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">Semua</option>
          {(["SHM", "HGB", "SHGB", "Girik", "Lainnya"] as CertificateType[]).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {showAllStatus && (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            defaultChecked={searchParams.get("show_all_status") === "1"}
            onChange={(e) => updateParams("show_all_status", e.target.checked ? "1" : "")}
            className="rounded border-gray-300"
          />
          Tampilkan semua status
        </label>
      )}
    </aside>
  );
}
