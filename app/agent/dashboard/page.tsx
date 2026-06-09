import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAgentRevenue,
  getAgentBookings,
  getAgentListings,
} from "@/lib/queries/agent-dashboard";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import { List, Calendar, BarChart3 } from "lucide-react";

export default async function AgentDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "agent" && session.user.role !== "admin") redirect("/");

  const agentId = Number(session.user.id);
  let revenue = { total_revenue: 0, total_transactions: 0, avg_transaction_value: 0 };
  let bookings: Awaited<ReturnType<typeof getAgentBookings>> = [];
  let listings: Awaited<ReturnType<typeof getAgentListings>> = [];

  try {
    [revenue, bookings, listings] = await Promise.all([
      getAgentRevenue(agentId),
      getAgentBookings(agentId),
      getAgentListings(agentId),
    ]);
  } catch {
    // DB unavailable
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  const quickLinks = [
    { href: "/agent/dashboard/listings", label: "Kelola Listing", icon: List, count: listings.length },
    { href: "/agent/dashboard/bookings", label: "Kelola Booking", icon: Calendar, count: pendingBookings },
    { href: "/agent/dashboard/analytics", label: "Analitik", icon: BarChart3 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Agen</h1>
      <p className="text-gray-500 text-sm mb-8">Selamat datang, {session.user.name}</p>

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
          <p className="text-sm text-gray-500">Rata-rata Nilai Transaksi</p>
          <p className="text-2xl font-bold font-mono mt-1">
            {formatRupiah(revenue.avg_transaction_value)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="bg-surface rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <Icon className="h-8 w-8 text-primary opacity-60" />
              <div>
                <p className="font-medium text-gray-900">{link.label}</p>
                {link.count !== undefined && (
                  <p className="text-sm text-gray-500">{link.count} item</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
