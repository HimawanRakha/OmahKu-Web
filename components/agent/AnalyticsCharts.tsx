"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatRupiah } from "@/lib/utils";

interface Props {
  monthlyRevenue: Array<{ label: string; revenue: number }>;
  typeDistribution: Array<{ name: string; value: number }>;
  topRated: Array<{ title: string; avg_rating: number; review_count: number }>;
  priceHistory: Array<{ date: string; price: number; property: string }>;
}

const COLORS = ["#1B4FD8", "#F97316"];

export function AnalyticsCharts({
  monthlyRevenue,
  typeDistribution,
  topRated,
  priceHistory,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-surface rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Pendapatan Bulanan</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} />
            <Tooltip formatter={(v) => formatRupiah(Number(v))} />
            <Bar dataKey="revenue" fill="#1B4FD8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Distribusi Tipe Transaksi</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={typeDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {typeDistribution.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Properti Rating Tertinggi</h3>
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-left">
            <tr>
              <th className="pb-2">Properti</th>
              <th className="pb-2">Rating</th>
              <th className="pb-2">Ulasan</th>
            </tr>
          </thead>
          <tbody>
            {topRated.map((p, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td className="py-2">{p.title}</td>
                <td className="py-2 font-mono">{p.avg_rating.toFixed(1)}</td>
                <td className="py-2">{p.review_count}</td>
              </tr>
            ))}
            {topRated.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-gray-400 text-center">Belum ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-surface rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Riwayat Perubahan Harga</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}jt`} />
            <Tooltip formatter={(v) => formatRupiah(Number(v))} />
            <Line type="monotone" dataKey="price" stroke="#F97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
