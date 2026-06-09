import Link from "next/link";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { PropertyCard } from "@/components/PropertyCard";
import {
  getFeaturedProperties,
  getLandingStats,
  getCategories,
} from "@/lib/queries/properties";
import { Search, Calendar, Receipt, Star } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  let stats = { total_properties: 0, total_transactions: 0, total_agents: 0 };
  let featured: Awaited<ReturnType<typeof getFeaturedProperties>> = [];
  let categories: { id: number; name: string }[] = [];

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : undefined;

  try {
    const [s, f, c] = await Promise.all([
      getLandingStats(),
      getFeaturedProperties(userId),
      getCategories(),
    ]);
    stats = s;
    featured = f;
    categories = c as unknown as { id: number; name: string }[];
  } catch {
    // DB belum tersedia — tampilkan halaman kosong
  }

  const steps = [
    { icon: Search, title: "Cari", desc: "Temukan properti dengan filter lengkap" },
    { icon: Calendar, title: "Booking", desc: "Ajukan booking ke agen properti" },
    { icon: Receipt, title: "Transaksi", desc: "Proses transaksi atomik yang aman" },
    { icon: Star, title: "Selesai & Ulasan", desc: "Beri ulasan setelah transaksi sukses" },
  ];

  return (
    <PublicLayout>
      <section className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-primary/90 to-primary">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920')" }}
        />
        <div className="relative z-10 w-full px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Temukan Rumah Impian Anda
          </h1>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Platform properti terpercaya untuk beli, sewa, dan bertransaksi dengan aman.
          </p>
          <HeroSearch categories={categories} />
        </div>
      </section>

      <section className="bg-surface border-y border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: stats.total_properties, label: "Properti Aktif" },
            { value: stats.total_transactions, label: "Transaksi Sukses" },
            { value: stats.total_agents, label: "Agen Terverifikasi" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold font-mono text-primary">{s.value.toLocaleString("id-ID")}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Properti Unggulan</h2>
          <Link href="/properties" className="text-sm text-primary font-medium hover:underline">
            Lihat Semua →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">
            Belum ada properti. Hubungkan database untuk melihat data.
          </p>
        )}
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Cara Kerja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-mono text-gray-400">Langkah {i + 1}</span>
                  <h3 className="font-semibold text-gray-900 mt-1">{step.title}</h3>
                  <p className="text-sm text-gray-500 mt-2">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
