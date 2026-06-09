import Image from "next/image";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { BookingSidebar } from "@/components/properties/BookingSidebar";
import { PropertyDetailTabs } from "@/components/properties/PropertyDetailTabs";
import { ListingTypeBadge, PropertyStatusBadge } from "@/components/StatusBadge";
import {
  getPropertyById,
  getPropertyImages,
  getPropertyFacilities,
  getPropertyReviews,
  getPriceHistory,
} from "@/lib/queries/properties";
import { formatPrice } from "@/lib/utils";
import { Bed, Bath, Layers, Maximize, Calendar, FileText, Compass } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);

  let property = null;
  let images: Awaited<ReturnType<typeof getPropertyImages>> = [];
  let facilities: Awaited<ReturnType<typeof getPropertyFacilities>> = [];
  let reviews: Awaited<ReturnType<typeof getPropertyReviews>> = [];
  let priceHistory: Awaited<ReturnType<typeof getPriceHistory>> = [];

  try {
    property = await getPropertyById(propertyId);
    if (property) {
      [images, facilities, reviews, priceHistory] = await Promise.all([
        getPropertyImages(propertyId),
        getPropertyFacilities(propertyId),
        getPropertyReviews(propertyId),
        getPriceHistory(propertyId),
      ]);
    }
  } catch {
    // DB unavailable
  }

  if (!property) notFound();

  const primaryImage = images.find((img) => img.is_primary) ?? images[0];
  const otherImages = images.filter((img) => img.id !== primaryImage?.id);

  const specs = [
    { icon: Bed, label: "Kamar Tidur", value: property.bedrooms },
    { icon: Bath, label: "Kamar Mandi", value: property.bathrooms },
    { icon: Layers, label: "Lantai", value: property.floors },
    { icon: Maximize, label: "Luas Bangunan", value: `${property.building_area} m²` },
    { icon: Maximize, label: "Luas Tanah", value: `${property.land_area} m²` },
    { icon: Calendar, label: "Tahun Dibangun", value: property.year_built ?? "—" },
    { icon: FileText, label: "Sertifikat", value: property.certificate_type },
    { icon: Compass, label: "Hadap", value: property.facing_direction },
  ];

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl overflow-hidden">
              {primaryImage && (
                <div className="sm:col-span-2 relative aspect-[4/3] bg-gray-100">
                  <Image
                    src={primaryImage.image_url as string}
                    alt={property.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {otherImages.slice(0, 4).map((img) => (
                  <div key={img.id as number} className="relative aspect-square bg-gray-100">
                    <Image
                      src={img.image_url as string}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex gap-2 mb-2">
                <ListingTypeBadge type={property.listing_type} />
                <PropertyStatusBadge status={property.status} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
              <p className="text-gray-500 mt-1">
                {property.district}, {property.city}, {property.province}
              </p>
              <p className="font-mono text-xl font-bold text-primary mt-3">
                {formatPrice(property.price, property.listing_type, property.rent_period)}
              </p>
            </div>

            <p className="text-gray-600 leading-relaxed">{property.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {specs.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                    <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <p className="text-sm font-medium">{s.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <PropertyDetailTabs
              facilities={facilities}
              reviews={reviews}
              priceHistory={priceHistory}
              avgRating={Number(property.avg_rating)}
            />
          </div>

          <div>
            <BookingSidebar property={property} />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
