import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PropertyCard } from "@/components/PropertyCard";
import { getAgentProfile, getAgentProperties } from "@/lib/queries/agents";
import { auth } from "@/lib/auth";
import { formatDate, formatRupiah } from "@/lib/utils";
import { BadgeCheck, Star } from "lucide-react";
import type { PropertyCardData } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params;
  const agentId = Number(id);
  const session = await auth();

  let profile = null;
  let properties: PropertyCardData[] = [];

  try {
    profile = await getAgentProfile(
      agentId,
      session?.user?.id ? Number(session.user.id) : undefined,
      session?.user?.role,
    );
    if (profile) {
      properties = (await getAgentProperties(agentId)) as unknown as PropertyCardData[];
    }
  } catch {
    // DB unavailable
  }

  if (!profile) notFound();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="bg-surface rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-5">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {profile.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                {profile.verified_at && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-gray-500">{profile.agency_name}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{profile.license_number}</p>
              {profile.bio && <p className="text-sm text-gray-600 mt-3 max-w-xl">{profile.bio}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Bergabung {formatDate(profile.created_at)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Transaksi Sukses</p>
              <p className="text-xl font-bold font-mono">{profile.total_transactions}</p>
            </div>
            {profile.total_revenue !== null && (
              <div>
                <p className="text-sm text-gray-500">Total Pendapatan</p>
                <p className="text-xl font-bold font-mono text-primary">
                  {formatRupiah(profile.total_revenue)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Rating Rata-rata</p>
              <p className="text-xl font-bold font-mono flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                {profile.avg_rating ? profile.avg_rating.toFixed(1) : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Properti Aktif</p>
              <p className="text-xl font-bold font-mono">{profile.active_property_count}</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Listing Properti</h2>
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Belum ada properti aktif.</p>
        )}
      </div>
    </PublicLayout>
  );
}
