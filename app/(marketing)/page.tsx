import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Nile Fleet Management System
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-500">
          A web-based car fleet management and decision-support system for managing vehicle requests, approvals, drivers, allocations, trips, and reports.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}