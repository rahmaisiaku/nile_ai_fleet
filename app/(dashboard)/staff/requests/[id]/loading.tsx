import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function StaffRequestDetailsLoading() {
  return (
    <DashboardShell
      role="staff"
      title="Request Details"
      subtitle="Loading request details..."
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, itemIndex) => (
                  <div key={itemIndex}>
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-4/6 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}