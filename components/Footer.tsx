import Link from "next/link";
import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-white mb-4">
              <Home className="h-6 w-6" />
              OmahKu
            </Link>
            <p className="text-sm text-gray-400 max-w-sm">
              Platform properti terpercaya untuk mencari, booking, dan bertransaksi properti impian Anda.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/properties?listing_type=sale" className="hover:text-white transition-colors">Beli Properti</Link></li>
              <li><Link href="/properties?listing_type=rent" className="hover:text-white transition-colors">Sewa Properti</Link></li>
              <li><Link href="/agents" className="hover:text-white transition-colors">Direktori Agen</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Tentang Kami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Akun</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-white transition-colors">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Daftar</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} OmahKu. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  );
}
