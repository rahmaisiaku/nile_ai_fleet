import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="text-sm text-slate-500">Loading reset page...</div>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}