import { PropertyForm } from "@/components/agent/PropertyForm";
import { getCategories, getLocations } from "@/lib/queries/properties";
import { getFacilities } from "@/lib/queries/agent-dashboard";

export default async function NewListingPage() {
  let categories: { id: number; name: string }[] = [];
  let facilities: { id: number; name: string; is_countable: boolean }[] = [];
  let locations: { id: number; province: string; city: string; district: string }[] = [];

  try {
    const [cats, facs, locs] = await Promise.all([
      getCategories(),
      getFacilities(),
      getLocations(),
    ]);
    categories = cats as unknown as { id: number; name: string }[];
    facilities = facs as unknown as { id: number; name: string; is_countable: boolean }[];
    locations = locs as unknown as { id: number; province: string; city: string; district: string }[];
  } catch {
    // DB unavailable
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Properti</h1>
      <PropertyForm
        categories={categories}
        facilities={facilities}
        locations={locations}
      />
    </div>
  );
}
