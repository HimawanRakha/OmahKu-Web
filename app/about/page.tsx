import { PublicLayout } from "@/components/layout/PublicLayout";

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Tentang OmahKu</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600">
          <p>
            OmahKu adalah platform properti terpercaya yang menghubungkan pembeli, penyewa,
            dan agen properti dalam satu ekosistem digital yang aman dan transparan.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">Cara Kerja</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Cari</strong> — Temukan properti impian dengan filter lengkap</li>
            <li><strong>Booking</strong> — Ajukan booking langsung ke agen properti</li>
            <li><strong>Transaksi</strong> — Proses transaksi atomik yang aman</li>
            <li><strong>Selesai & Ulasan</strong> — Berikan ulasan setelah transaksi sukses</li>
          </ol>
          <p className="mt-6 text-sm text-gray-500">
            Satu akun bisa menjadi owner properti sekaligus customer di properti lain.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
