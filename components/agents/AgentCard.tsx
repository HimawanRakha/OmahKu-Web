import Link from "next/link";
import { BadgeCheck, Star, Home } from "lucide-react";
import type { AgentCardData } from "@/types";

export function AgentCard({ agent }: { agent: AgentCardData }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="block bg-surface rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
          {agent.full_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 truncate">{agent.full_name}</h3>
            {agent.verified_at && (
              <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500">{agent.agency_name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{agent.license_number}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 text-sm">
          <Home className="h-4 w-4 text-gray-400" />
          <span>{agent.active_property_count} properti</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="font-medium">
            {agent.avg_rating ? Number(agent.avg_rating).toFixed(1) : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
