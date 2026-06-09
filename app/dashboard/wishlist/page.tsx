"use client";

import { useEffect, useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import type { PropertyCardData } from "@/types";

export default function WishlistPage() {
  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/dashboard/wishlist")
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? []))
      .catch(() => toast("error", "Gagal memuat wishlist."))
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleRemove(propertyId: number) {
    const res = await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: propertyId }),
    });
    if (res.ok) {
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      toast("success", "Dihapus dari wishlist.");
    }
  }

  if (loading) {
    return <p className="text-gray-500">Memuat...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wishlist Saya</h1>
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              showRemove
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Wishlist kosong"
          description="Simpan properti favorit Anda untuk dilihat nanti."
          ctaLabel="Jelajahi Properti"
          ctaHref="/properties"
        />
      )}
    </div>
  );
}
