import { PublicLayout } from "@/components/layout/PublicLayout";
import { AgentCard } from "@/components/agents/AgentCard";
import { EmptyState } from "@/components/EmptyState";
import { getAgents } from "@/lib/queries/agents";
import type { AgentCardData } from "@/types";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let agents: AgentCardData[] = [];

  try {
    agents = await getAgents(params.city, params.min_rating ? Number(params.min_rating) : undefined);
  } catch {
    // DB unavailable
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Direktori Agen</h1>
        <p className="text-gray-500 text-sm mb-8">{agents.length} agen terdaftar</p>

        {agents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada agen"
            description="Hubungkan database untuk melihat direktori agen."
            ctaLabel="Kembali ke Beranda"
            ctaHref="/"
          />
        )}
      </div>
    </PublicLayout>
  );
}
