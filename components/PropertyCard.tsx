"use client";

import Link from "next/link";
import { Heart, Star, Bed, Bath, Maximize, BadgeCheck } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { PropertyCardData } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { ListingTypeBadge, PropertyStatusBadge } from "@/components/StatusBadge";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PropertyCardProps {
  property: PropertyCardData;
  onWishlistToggle?: (propertyId: number, isWishlisted: boolean) => void;
  showRemove?: boolean;
  onRemove?: (propertyId: number) => void;
}

export function PropertyCard({ property, onWishlistToggle, showRemove, onRemove }: PropertyCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(property.is_wishlisted ?? false);
  const [loading, setLoading] = useState(false);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: property.id }),
      });
      if (res.ok) {
        setWishlisted(!wishlisted);
        onWishlistToggle?.(property.id, !wishlisted);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/properties/${property.id}`} className="group block bg-surface rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3] bg-gray-100">
        {property.primary_image_url ? (
          <SafeImage src={property.primary_image_url} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <Maximize className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <ListingTypeBadge type={property.listing_type} />
          <PropertyStatusBadge status={property.status} />
        </div>
        {!showRemove && (
          <button onClick={handleWishlist} disabled={loading} className={cn("absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow hover:bg-white transition-colors", wishlisted && "text-red-500")}>
            <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} />
          </button>
        )}
        {showRemove && onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(property.id);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow text-red-500 hover:bg-red-50"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
        )}
      </div>

      <div className="p-4">
        <p className="font-mono text-lg font-semibold text-primary mb-1">{formatPrice(property.price, property.listing_type, property.rent_period)}</p>
        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{property.title}</h3>
        <p className="text-sm text-gray-500 mb-3">
          {property.district}, {property.city}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Bed className="h-4 w-4" /> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" /> {property.bathrooms}
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="h-4 w-4" /> {property.building_area} m²
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{property.avg_rating ? Number(property.avg_rating).toFixed(1) : "—"}</span>
            <span className="text-gray-400">({property.review_count})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{property.agent_name.charAt(0)}</div>
            <span className="text-xs text-gray-500 truncate max-w-[80px]">{property.agent_name}</span>
            {property.agent_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
          </div>
        </div>
      </div>
    </Link>
  );
}
