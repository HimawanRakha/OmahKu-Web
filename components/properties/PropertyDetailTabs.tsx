"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  formatDate,
  formatRupiah,
  formatPriceChangePercent,
} from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

type Tab = "facilities" | "reviews" | "price_history";

interface Props {
  facilities: RowDataPacket[];
  reviews: RowDataPacket[];
  priceHistory: RowDataPacket[];
  avgRating: number;
}

export function PropertyDetailTabs({
  facilities,
  reviews,
  priceHistory,
  avgRating,
}: Props) {
  const [tab, setTab] = useState<Tab>("facilities");

  const tabs: { id: Tab; label: string }[] = [
    { id: "facilities", label: "Fasilitas" },
    { id: "reviews", label: `Ulasan (${reviews.length})` },
    { id: "price_history", label: "Riwayat Harga" },
  ];

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Number(r.rating) === star).length,
  }));

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "facilities" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {facilities.length > 0 ? (
            facilities.map((f) => (
              <div key={f.id as number} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <span className="text-2xl">{f.facility_icon as string}</span>
                <div>
                  <p className="text-sm font-medium">{f.facility_name as string}</p>
                  {f.is_countable && f.quantity != null && (
                    <p className="text-xs text-gray-500">{String(f.quantity)} unit</p>
                  )}
                  {f.notes && (
                    <p className="text-xs text-gray-400">{f.notes as string}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full">Belum ada data fasilitas.</p>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div>
          <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{avgRating.toFixed(1)}</p>
              <div className="flex gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{reviews.length} ulasan</p>
            </div>
            <div className="flex-1 space-y-1">
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{star}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-6 text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id as number} className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{r.reviewer_name as string}</p>
                  <p className="text-xs text-gray-400">{formatDate(r.created_at as string)}</p>
                </div>
                <div className="flex gap-0.5 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${s <= Number(r.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment as string}</p>}
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-gray-500">Belum ada ulasan.</p>
            )}
          </div>
        </div>
      )}

      {tab === "price_history" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4">Tanggal</th>
                <th className="pb-3 pr-4">Harga Lama</th>
                <th className="pb-3 pr-4">Harga Baru</th>
                <th className="pb-3 pr-4">Perubahan</th>
                <th className="pb-3">Oleh</th>
              </tr>
            </thead>
            <tbody>
              {priceHistory.map((ph) => (
                <tr key={ph.id as number} className="border-b border-gray-50">
                  <td className="py-3 pr-4">{formatDate(ph.created_at as string)}</td>
                  <td className="py-3 pr-4 font-mono">{formatRupiah(Number(ph.old_price))}</td>
                  <td className="py-3 pr-4 font-mono">{formatRupiah(Number(ph.new_price))}</td>
                  <td className="py-3 pr-4 font-mono">
                    {formatPriceChangePercent(Number(ph.old_price), Number(ph.new_price))}
                  </td>
                  <td className="py-3">{ph.changed_by_name as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {priceHistory.length === 0 && (
            <p className="text-gray-500 py-4">Belum ada riwayat perubahan harga.</p>
          )}
        </div>
      )}
    </div>
  );
}
