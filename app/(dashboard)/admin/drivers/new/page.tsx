import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DriverForm } from "@/components/forms/driver-form";
import { createDriverAction } from "@/app/actions/drivers";

export default function NewDriverPage() {
  return (
    <DashboardShell
      role="admin"
      title="New Driver"
      subtitle="Create a driver auth account, profile, and driver record."
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Driver Setup
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a new driver and activate the account immediately.
          </p>
        </div>

        <DriverForm mode="create" action={createDriverAction} />
      </div>
    </DashboardShell>
  );
}