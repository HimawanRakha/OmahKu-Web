import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { SortSelect } from "@/components/properties/SortSelect";
import { EmptyState } from "@/components/EmptyState";
import { getProperties, getCategories, getLocations } from "@/lib/queries/properties";
import { auth } from "@/lib/auth";
import type { PropertyFilters as Filters, PropertySortOption } from "@/types";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function parseFilters(params: Record<string, string | undefined>): Filters {
  return {
    listing_type: params.listing_type as Filters["listing_type"],
    category_id: params.category_id ? Number(params.category_id) : undefined,
    price_min: params.price_min ? Number(params.price_min) : undefined,
    price_max: params.price_max ? Number(params.price_max) : undefined,
    rent_period: params.rent_period as Filters["rent_period"],
    province: params.province,
    city: params.city,
    district: params.district,
    bedrooms_min: params.bedrooms_min ? Number(params.bedrooms_min) : undefined,
    bathrooms_min: params.bathrooms_min ? Number(params.bathrooms_min) : undefined,
    certificate_type: params.certificate_type as Filters["certificate_type"],
    search: params.search,
  };
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const sort = (params.sort ?? "newest") as PropertySortOption;
  const showAllStatus = params.show_all_status === "1";

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : undefined;
  const isPrivileged = session?.user?.role === "admin" || session?.user?.role === "agent";

  let properties: Awaited<ReturnType<typeof getProperties>> = [];
  let categories: { id: number; name: string }[] = [];
  let locations: { province: string; city: string; district: string }[] = [];

  try {
    const [props, cats, locs] = await Promise.all([
      getProperties(filters, sort, showAllStatus && isPrivileged, userId, params.min_rating ? Number(params.min_rating) : undefined),
      getCategories(),
      getLocations(),
    ]);
    properties = props;
    categories = cats as unknown as { id: number; name: string }[];
    locations = locs as unknown as { province: string; city: string; district: string }[];
  } catch {
    // DB unavailable
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Properti</h1>
          <p className="text-gray-500 text-sm mt-1">{properties.length} properti ditemukan</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <Suspense>
            <PropertyFilters
              categories={categories}
              locations={locations}
              showAllStatus={isPrivileged}
            />
          </Suspense>

          <div className="flex-1">
            <div className="flex justify-end mb-4">
              <Suspense fallback={<div className="h-9 w-40 bg-gray-100 rounded-lg animate-pulse" />}>
                <SortSelect current={sort} />
              </Suspense>
            </div>

            {properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Tidak ada properti ditemukan"
                description="Coba ubah filter pencarian atau hubungkan database."
                ctaLabel="Reset Filter"
                ctaHref="/properties"
              />
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
