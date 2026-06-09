import { PublicLayout } from "@/components/layout/PublicLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Daftar Akun OmahKu</h1>
            <p className="text-gray-500 mt-2 text-sm">Buat akun untuk mulai mencari properti</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-200 p-6 shadow-sm">
            <RegisterForm />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
