"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatNIK, parseNIK } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState<"user" | "agent">("user");
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: form.get("full_name"),
        nik: parseNIK(nik),
        username: form.get("username"),
        email: form.get("email"),
        phone_number: form.get("phone_number"),
        password: form.get("password"),
        role,
        agency_name: form.get("agency_name"),
        license_number: form.get("license_number"),
        bio: form.get("bio"),
      }),
    });

    setLoading(false);
    const data = await res.json();

    if (!res.ok) {
      toast("error", data.error ?? "Gagal mendaftar.");
      return;
    }

    toast("success", "Akun berhasil dibuat! Silakan masuk.");
    router.push("/login");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
        {(["user", "agent"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              role === r ? "bg-white text-primary shadow-sm" : "text-gray-500"
            }`}
          >
            {r === "user" ? "Daftar sebagai Pengguna" : "Daftar sebagai Agen"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
          <input name="full_name" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">NIK</label>
          <input
            value={nik}
            onChange={(e) => setNik(formatNIK(e.target.value))}
            required
            maxLength={19}
            placeholder="####.####.####.####"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <input name="username" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Telepon</label>
          <input name="phone_number" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
          <input name="password_confirm" type="password" required minLength={8} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      {role === "agent" && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Data Agen</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Agensi</label>
            <input name="agency_name" required={role === "agent"} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Lisensi</label>
            <input name="license_number" required={role === "agent"} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea name="bio" rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-secondary py-2.5 text-sm font-medium text-white hover:bg-secondary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Memproses..." : "Daftar"}
      </button>
      <p className="text-center text-sm text-gray-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Masuk</Link>
      </p>
    </form>
  );
}
