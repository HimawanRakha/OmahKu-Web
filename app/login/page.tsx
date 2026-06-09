import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Masuk ke OmahKu</h1>
            <p className="text-gray-500 mt-2 text-sm">Masukkan kredensial akun Anda</p>
          </div>
          <div className="bg-surface rounded-xl border border-gray-200 p-6 shadow-sm">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
