"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { PropertyStatusBadge } from "@/components/StatusBadge";
import { formatPrice } from "@/lib/utils";
import type { ListingType, PropertyStatus, RentPeriod } from "@/types";

interface Listing {
  id: number;
  title: string;
  category_name: string;
  price: number;
  listing_type: ListingType;
  rent_period: RentPeriod | null;
  status: PropertyStatus;
  avg_rating: number;
  thumbnail: string | null;
}

export default function AgentListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/listings")
      .then((r) => r.json())
      .then((data) => setListings(data.listings ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Listing</h1>
        <Link
          href="/agent/dashboard/listings/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Tambah Properti
        </Link>
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Properti</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-gray-100 shrink-0" />
                    <span className="font-medium">{l.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{l.category_name}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatPrice(l.price, l.listing_type, l.rent_period)}
                </td>
                <td className="px-4 py-3">
                  <PropertyStatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3">{Number(l.avg_rating).toFixed(1)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/agent/dashboard/listings/${l.id}/edit`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Belum ada listing. Tambah properti pertama Anda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
