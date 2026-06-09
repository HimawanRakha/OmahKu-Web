"use client";

import { useEffect, useState } from "react";
import { BookingStatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDateTime } from "@/lib/utils";
import type { BookingStatus } from "@/types";

interface Booking {
  id: number;
  property_title: string;
  customer_name: string;
  status: BookingStatus;
  created_at: string;
}

export default function AgentBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  function load() {
    fetch("/api/agent/bookings")
      .then((r) => r.json())
      .then((data) => setBookings(data.bookings ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(bookingId: number, status: BookingStatus) {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId, status }),
    });
    if (res.ok) {
      toast("success", status === "confirmed" ? "Booking dikonfirmasi." : "Booking ditolak.");
      load();
    } else {
      toast("error", "Gagal memperbarui booking.");
    }
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kelola Booking</h1>
      <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">Properti</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{b.property_title}</td>
                <td className="px-4 py-3">{b.customer_name}</td>
                <td className="px-4 py-3 text-gray-500">{formatDateTime(b.created_at)}</td>
                <td className="px-4 py-3">
                  <BookingStatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3">
                  {b.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(b.id, "confirmed")}
                        className="text-xs text-green-600 font-medium hover:underline"
                      >
                        Konfirmasi
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="text-xs text-red-600 font-medium hover:underline"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                  {b.status === "confirmed" && (
                    <span className="text-xs text-gray-400">Siap buat transaksi</span>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Belum ada booking masuk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
