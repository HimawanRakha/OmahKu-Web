"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import type { CertificateType, ListingType, RentPeriod } from "@/types";

interface Category {
  id: number;
  name: string;
}

interface Facility {
  id: number;
  name: string;
  is_countable: boolean;
}

interface Location {
  id: number;
  province: string;
  city: string;
  district: string;
}

interface Props {
  categories: Category[];
  facilities: Facility[];
  locations: Location[];
  initialData?: Record<string, unknown>;
  propertyId?: number;
}

export function PropertyForm({
  categories,
  facilities,
  locations,
  initialData,
  propertyId,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: (initialData?.title as string) ?? "",
    description: (initialData?.description as string) ?? "",
    listing_type: (initialData?.listing_type as ListingType) ?? "sale",
    price: (initialData?.price as number) ?? 0,
    rent_period: (initialData?.rent_period as RentPeriod) ?? "month",
    bedrooms: (initialData?.bedrooms as number) ?? 1,
    bathrooms: (initialData?.bathrooms as number) ?? 1,
    floors: (initialData?.floors as number) ?? 1,
    land_area: (initialData?.land_area as number) ?? 0,
    building_area: (initialData?.building_area as number) ?? 0,
    year_built: (initialData?.year_built as number) ?? new Date().getFullYear(),
    certificate_type: (initialData?.certificate_type as CertificateType) ?? "SHM",
    facing_direction: (initialData?.facing_direction as string) ?? "utara",
    address_detail: (initialData?.address_detail as string) ?? "",
    location_id: (initialData?.location_id as number) ?? 0,
    selectedFacilities: (initialData?.selectedFacilities as number[]) ?? [],
    image_urls: ((initialData?.image_urls as string[])?.length
      ? (initialData?.image_urls as string[])
      : [""]),
    primary_image_index: (initialData?.primary_image_index as number) ?? 0,
  });

  const [priceConfirm, setPriceConfirm] = useState(false);
  const isEdit = !!propertyId;
  const priceChanged = isEdit && initialData?.price !== form.price;

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (isEdit && priceChanged && !priceConfirm) {
      toast("warning", "Konfirmasi perubahan harga terlebih dahulu.");
      return;
    }
    if (form.listing_type === "rent" && !form.rent_period) {
      toast("error", "Periode sewa wajib diisi untuk tipe sewa.");
      return;
    }
    if (!form.location_id) {
      toast("error", "Pilih lokasi terlebih dahulu.");
      setStep(3);
      return;
    }
    if (!form.address_detail.trim()) {
      toast("error", "Alamat lengkap wajib diisi.");
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/agent/listings/${propertyId}` : "/api/agent/listings",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      if (res.ok) {
        toast("success", isEdit ? "Properti diperbarui." : "Properti ditambahkan.");
        router.push("/agent/dashboard/listings");
      } else {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error ?? "Gagal menyimpan properti.");
      }
    } catch {
      toast("error", "Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const provinces = [...new Set(locations.map((l) => l.province))];

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full ${step >= s ? "bg-primary" : "bg-gray-200"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Info Dasar</h2>
          <input
            placeholder="Judul properti"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
          />
          <textarea
            placeholder="Deskripsi"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
          />
          <div className="flex gap-2">
            {(["sale", "rent"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update("listing_type", t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                  form.listing_type === t ? "bg-primary text-white border-primary" : "border-gray-200"
                }`}
              >
                {t === "sale" ? "Dijual" : "Disewakan"}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Harga"
            value={form.price}
            onChange={(e) => update("price", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-mono"
          />
          {isEdit && priceChanged && (
            <label className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              <input
                type="checkbox"
                checked={priceConfirm}
                onChange={(e) => setPriceConfirm(e.target.checked)}
              />
              Perubahan harga akan dicatat otomatis di riwayat harga.
            </label>
          )}
          {form.listing_type === "rent" && (
            <select
              value={form.rent_period}
              onChange={(e) => update("rent_period", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white"
            >
              <option value="day">Per Hari</option>
              <option value="month">Per Bulan</option>
              <option value="year">Per Tahun</option>
            </select>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Detail & Fasilitas</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "bedrooms", label: "Kamar Tidur" },
              { key: "bathrooms", label: "Kamar Mandi" },
              { key: "floors", label: "Lantai" },
              { key: "land_area", label: "Luas Tanah (m²)" },
              { key: "building_area", label: "Luas Bangunan (m²)" },
              { key: "year_built", label: "Tahun Dibangun" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-sm text-gray-600">{f.label}</label>
                <input
                  type="number"
                  value={form[f.key as keyof typeof form] as number}
                  onChange={(e) => update(f.key, Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <select
            value={form.certificate_type}
            onChange={(e) => update("certificate_type", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white"
          >
            {(["SHM", "HGB", "SHGB", "Girik", "Lainnya"] as CertificateType[]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div>
            <label className="text-sm text-gray-600">Arah Hadap</label>
            <select
              value={form.facing_direction}
              onChange={(e) => update("facing_direction", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white"
            >
              {[
                { v: "utara", l: "Utara" },
                { v: "timur", l: "Timur" },
                { v: "selatan", l: "Selatan" },
                { v: "barat", l: "Barat" },
                { v: "timur_laut", l: "Timur Laut" },
                { v: "tenggara", l: "Tenggara" },
                { v: "barat_daya", l: "Barat Daya" },
                { v: "barat_laut", l: "Barat Laut" },
              ].map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Fasilitas</p>
            <div className="grid grid-cols-2 gap-2">
              {facilities.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.selectedFacilities.includes(f.id)}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? [...form.selectedFacilities, f.id]
                        : form.selectedFacilities.filter((id) => id !== f.id);
                      update("selectedFacilities", ids);
                    }}
                  />
                  {f.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Lokasi</h2>
          <select
            value={form.location_id}
            onChange={(e) => update("location_id", Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm bg-white"
          >
            <option value={0}>Pilih lokasi</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.district}, {l.city}, {l.province}
              </option>
            ))}
          </select>
          <div>
            <label className="text-sm text-gray-600">Alamat Lengkap</label>
            <input
              placeholder="Jl. Contoh No. 123, RT/RW, patokan"
              value={form.address_detail}
              onChange={(e) => update("address_detail", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400">
            {provinces.length} provinsi tersedia di database
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Foto</h2>
          {form.image_urls.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                placeholder="URL gambar"
                value={url}
                onChange={(e) => {
                  const urls = [...form.image_urls];
                  urls[i] = e.target.value;
                  update("image_urls", urls);
                }}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
              />
              <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <input
                  type="radio"
                  name="primary"
                  checked={form.primary_image_index === i}
                  onChange={() => update("primary_image_index", i)}
                />
                Utama
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("image_urls", [...form.image_urls, ""])}
            className="text-sm text-primary hover:underline"
          >
            + Tambah foto
          </button>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-4 py-2 text-sm text-gray-600 disabled:opacity-30"
        >
          Kembali
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium"
          >
            Lanjut
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-secondary text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Properti"}
          </button>
        )}
      </div>
    </div>
  );
}
