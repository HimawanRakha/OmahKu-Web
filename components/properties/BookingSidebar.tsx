"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import type { PropertyWithDetails } from "@/types";
import {
  formatPrice,
  getBookingDisabledMessage,
  formatRupiah,
} from "@/lib/utils";
import { calculateRentCost } from "@/lib/rent-cost-calculator";
import { useToast } from "@/components/providers/ToastProvider";
import { ListingTypeBadge, PropertyStatusBadge } from "@/components/StatusBadge";

export function BookingSidebar({ property }: { property: PropertyWithDetails }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled = property.status !== "available";
  const disabledMsg = getBookingDisabledMessage(property.status);

  const rentTotal =
    property.listing_type === "rent" &&
    property.rent_period &&
    startDate &&
    endDate
      ? calculateRentCost(
          startDate,
          endDate,
          property.price,
          property.rent_period,
        )
      : 0;

  async function handleBooking() {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: property.id }),
      });
      if (res.ok) {
        toast("success", "Booking berhasil diajukan!");
      } else {
        const data = await res.json();
        toast("error", data.error ?? "Gagal mengajukan booking.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sticky top-20 bg-surface rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
      <div>
        <p className="font-mono text-2xl font-bold text-primary">
          {formatPrice(property.price, property.listing_type, property.rent_period)}
        </p>
        <div className="flex gap-2 mt-2">
          <ListingTypeBadge type={property.listing_type} />
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>

      {property.listing_type === "rent" && !disabled && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          {rentTotal > 0 && (
            <div className="rounded-lg bg-primary/5 p-3">
              <p className="text-sm text-gray-600">Estimasi Total Sewa</p>
              <p className="font-mono text-lg font-bold text-primary">
                {formatRupiah(rentTotal)}
              </p>
            </div>
          )}
        </div>
      )}

      {disabled ? (
        <p className="text-sm text-gray-500 text-center py-2">{disabledMsg}</p>
      ) : (
        <button
          onClick={handleBooking}
          disabled={loading}
          className="w-full rounded-lg bg-secondary py-3 text-sm font-semibold text-white hover:bg-secondary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Memproses..." : "Ajukan Booking"}
        </button>
      )}

      <hr className="border-gray-100" />

      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Agen Properti</p>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {property.agent_name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              {property.agent_name}
              {property.agent_verified && (
                <BadgeCheck className="h-4 w-4 text-primary" />
              )}
            </p>
            <p className="text-sm text-gray-500">{property.agency_name}</p>
            <p className="text-xs text-gray-400 font-mono">{property.license_number}</p>
          </div>
        </div>
        {property.agent_verified && (
          <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Terverifikasi
          </span>
        )}
      </div>
    </div>
  );
}
