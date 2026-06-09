"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, cn } from "@/lib/utils";

interface Review {
  id: number;
  property_title: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/reviews")
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ulasan Saya</h1>
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-surface rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{r.property_title}</h3>
                <p className="text-xs text-gray-400">{formatDate(r.created_at)}</p>
              </div>
              <div className="flex gap-0.5 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-4 w-4",
                      s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                    )}
                  />
                ))}
              </div>
              {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada ulasan"
          description="Ulasan dapat ditulis setelah transaksi berhasil."
          ctaLabel="Lihat Transaksi"
          ctaHref="/dashboard/transactions"
        />
      )}
    </div>
  );
}
