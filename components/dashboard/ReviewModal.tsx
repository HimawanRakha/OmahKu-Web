"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: number;
  transactionId: number;
  propertyTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({
  propertyId,
  transactionId,
  propertyTitle,
  onClose,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast("warning", "Pilih rating 1-5 bintang.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: propertyId, transaction_id: transactionId, rating, comment }),
    });
    setLoading(false);
    if (res.ok) {
      toast("success", "Ulasan berhasil dikirim!");
      onSuccess();
      onClose();
    } else {
      toast("error", "Gagal mengirim ulasan.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Tulis Ulasan</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{propertyTitle}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    (hover || rating) >= s
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300",
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Ceritakan pengalaman Anda..."
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </form>
      </div>
    </div>
  );
}
