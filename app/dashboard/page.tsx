import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getUserDashboardSummary,
  getUserTransactions,
} from "@/lib/queries/dashboard";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import { TransactionStatusBadge } from "@/components/StatusBadge";
import { Heart, Receipt, Star } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = Number(session.user.id);
  let summary = { wishlist_count: 0, active_transactions: 0, review_count: 0 };
  let transactions: Awaited<ReturnType<typeof getUserTransactions>> = [];

  try {
    [summary, transactions] = await Promise.all([
      getUserDashboardSummary(userId),
      getUserTransactions(userId),
    ]);
  } catch {
    // DB unavailable
  }

  const cards = [
    { label: "Wishlist", value: summary.wishlist_count, icon: Heart, href: "/dashboard/wishlist", color: "text-red-500" },
    { label: "Transaksi Aktif", value: summary.active_transactions, icon: Receipt, href: "/dashboard/transactions", color: "text-primary" },
    { label: "Ulasan Ditulis", value: summary.review_count, icon: Star, href: "/dashboard/reviews", color: "text-yellow-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Halo, {session.user.name}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">Selamat datang di dashboard Anda.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="bg-surface rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{c.label}</p>
                  <p className="text-2xl font-bold font-mono mt-1">{c.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${c.color} opacity-60`} />
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terbaru</h2>
      <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Properti</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 5).map((t) => (
              <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">#{t.id}</td>
                <td className="px-4 py-3">{t.property_title}</td>
                <td className="px-4 py-3 capitalize">{t.transaction_type}</td>
                <td className="px-4 py-3">
                  <TransactionStatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3 font-mono">{formatRupiah(t.agreed_amount)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDateTime(t.created_at)}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
