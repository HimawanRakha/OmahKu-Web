import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAgentRevenue,
  getMonthlyRevenue,
  getTransactionTypeDistribution,
  getTopRatedProperties,
  getAgentPriceHistory,
} from "@/lib/queries/agent-dashboard";
import { AnalyticsCharts } from "@/components/agent/AnalyticsCharts";
import { formatRupiah } from "@/lib/utils";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "agent" && session.user.role !== "admin") redirect("/");

  const agentId = Number(session.user.id);

  let revenue = { total_revenue: 0, total_transactions: 0, avg_transaction_value: 0 };
  let monthly: Awaited<ReturnType<typeof getMonthlyRevenue>> = [];
  let typeDist: Awaited<ReturnType<typeof getTransactionTypeDistribution>> = [];
  let topRated: Awaited<ReturnType<typeof getTopRatedProperties>> = [];
  let priceHistory: Awaited<ReturnType<typeof getAgentPriceHistory>> = [];

  try {
    [revenue, monthly, typeDist, topRated, priceHistory] = await Promise.all([
      getAgentRevenue(agentId),
      getMonthlyRevenue(agentId),
      getTransactionTypeDistribution(agentId),
      getTopRatedProperties(agentId),
      getAgentPriceHistory(agentId),
    ]);
  } catch {
    // DB unavailable
  }

  const monthlyData = monthly.map((m) => ({
    label: `${m.revenue_month}/${m.revenue_year}`,
    revenue: Number(m.total_revenue),
  }));

  const typeData = typeDist.map((t) => ({
    name: t.transaction_type === "sale" ? "Jual" : "Sewa",
    value: Number(t.count),
  }));

  const topRatedData = topRated.map((p) => ({
    title: p.property_title,
    avg_rating: Number(p.avg_rating),
    review_count: Number(p.review_count),
  }));

  const priceHistoryData = priceHistory.map((ph) => ({
    date: new Date(ph.created_at as string).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
    price: Number(ph.new_price),
    property: ph.property_title as string,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analitik Pendapatan</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Pendapatan</p>
          <p className="text-2xl font-bold font-mono text-primary mt-1">
            {formatRupiah(revenue.total_revenue)}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Transaksi Sukses</p>
          <p className="text-2xl font-bold font-mono mt-1">{revenue.total_transactions}</p>
        </div>
        <div className="bg-surface rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Rata-rata Nilai</p>
          <p className="text-2xl font-bold font-mono mt-1">
            {formatRupiah(revenue.avg_transaction_value)}
          </p>
        </div>
      </div>

      <AnalyticsCharts
        monthlyRevenue={monthlyData}
        typeDistribution={typeData}
        topRated={topRatedData}
        priceHistory={priceHistoryData}
      />
    </div>
  );
}
