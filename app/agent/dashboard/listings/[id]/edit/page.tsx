import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/agent/PropertyForm";
import { auth } from "@/lib/auth";
import {
  getCategories,
  getLocations,
  getPropertyById,
  getPropertyFacilities,
  getPropertyImages,
} from "@/lib/queries/properties";
import { getFacilities } from "@/lib/queries/agent-dashboard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  const session = await auth();
  const agentId = Number(session?.user?.id);

  let categories: { id: number; name: string }[] = [];
  let facilities: { id: number; name: string; is_countable: boolean }[] = [];
  let locations: { id: number; province: string; city: string; district: string }[] = [];
  let initialData: Record<string, unknown> | null = null;

  try {
    const property = await getPropertyById(propertyId);
    if (!property) notFound();

    // Hanya agen pengelola / pemilik yang boleh mengedit.
    if (Number(property.agent_id) !== agentId && Number(property.owner_id) !== agentId) {
      notFound();
    }

    const [cats, facs, locs, propFacs, propImgs] = await Promise.all([
      getCategories(),
      getFacilities(),
      getLocations(),
      getPropertyFacilities(propertyId),
      getPropertyImages(propertyId),
    ]);

    categories = cats as unknown as { id: number; name: string }[];
    facilities = facs as unknown as { id: number; name: string; is_countable: boolean }[];
    locations = locs as unknown as { id: number; province: string; city: string; district: string }[];

    const imageUrls = propImgs.map((img) => img.image_url as string);
    const primaryIdx = propImgs.findIndex((img) => img.is_primary);

    initialData = {
      ...property,
      selectedFacilities: propFacs.map((f) => f.facility_id as number),
      image_urls: imageUrls,
      primary_image_index: primaryIdx >= 0 ? primaryIdx : 0,
    };
  } catch {
    if (!initialData) notFound();
  }

  if (!initialData) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Properti</h1>
      <PropertyForm
        categories={categories}
        facilities={facilities}
        locations={locations}
        initialData={initialData}
        propertyId={propertyId}
      />
    </div>
  );
}
