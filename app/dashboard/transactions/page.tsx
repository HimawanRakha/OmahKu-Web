"use client";

import { useEffect, useState } from "react";
import { TransactionStatusBadge } from "@/components/StatusBadge";
import { TransactionTimeline } from "@/components/dashboard/TransactionTimeline";
import { ReviewModal } from "@/components/dashboard/ReviewModal";
import { EmptyState } from "@/components/EmptyState";
import { formatRupiah, formatDate } from "@/lib/utils";
import { calculateRentCost } from "@/lib/rent-cost-calculator";
import type { TransactionWithDetails } from "@/types";
import type { RentPeriod } from "@/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<TransactionWithDetails | null>(null);

  function load() {
    const url = statusFilter
      ? `/api/dashboard/transactions?status=${statusFilter}`
      : "/api/dashboard/transactions";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transaksi Saya</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="success">Selesai</option>
          <option value="failed">Gagal</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((t) => {
            const rentTotal =
              t.transaction_type === "rent" &&
              t.rent_start_date &&
              t.rent_end_date &&
              t.rent_price_per_period
                ? calculateRentCost(
                    t.rent_start_date,
                    t.rent_end_date,
                    t.rent_price_per_period,
                    "month" as RentPeriod,
                    t.rent_additional_fee ?? 0,
                  )
                : null;

            return (
              <div key={t.id} className="bg-surface rounded-xl border border-gray-200 p-5">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs text-gray-400">#{t.id}</p>
                        <h3 className="font-semibold text-gray-900">{t.property_title}</h3>
                        <p className="text-sm text-gray-500 capitalize mt-1">{t.transaction_type}</p>
                      </div>
                      <TransactionStatusBadge status={t.status} />
                    </div>
                    <p className="font-mono text-lg font-bold text-primary mt-3">
                      {formatRupiah(t.agreed_amount)}
                    </p>
                    {t.transaction_type === "rent" && t.rent_start_date && (
                      <div className="mt-3 text-sm text-gray-600 space-y-1">
                        <p>Periode: {formatDate(t.rent_start_date)} — {formatDate(t.rent_end_date!)}</p>
                        <p>Harga/periode: {formatRupiah(t.rent_price_per_period ?? 0)}</p>
                        {rentTotal && <p>Total kalkulasi: {formatRupiah(rentTotal)}</p>}
                      </div>
                    )}
                    {t.transaction_type === "sale" && (
                      <div className="mt-3 text-sm text-gray-600 space-y-1">
                        {t.sale_transfer_date && <p>Transfer: {formatDate(t.sale_transfer_date)}</p>}
                        {t.sale_certificate_number && <p>Sertifikat: {t.sale_certificate_number}</p>}
                      </div>
                    )}
                    {t.status === "success" && !t.has_review && (
                      <button
                        onClick={() => setReviewTarget(t)}
                        className="mt-4 text-sm text-primary font-medium hover:underline"
                      >
                        Tulis Ulasan
                      </button>
                    )}
                  </div>
                  <div className="lg:w-48">
                    <TransactionTimeline transactionStatus={t.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum ada transaksi"
          description="Transaksi akan muncul setelah booking dikonfirmasi."
          ctaLabel="Jelajahi Properti"
          ctaHref="/properties"
        />
      )}

      {reviewTarget && (
        <ReviewModal
          propertyId={reviewTarget.property_id}
          transactionId={reviewTarget.id}
          propertyTitle={reviewTarget.property_title}
          onClose={() => setReviewTarget(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
