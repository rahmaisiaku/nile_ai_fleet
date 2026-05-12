import { DashboardShell } from "@/components/layout/dashboard-shell";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { createVehicleAction } from "@/app/actions/vehicles";

export default function NewVehiclePage() {
  return (
    <DashboardShell
      role="admin"
      title="New Vehicle"
      subtitle="Create a new vehicle record for the fleet."
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Vehicle Setup
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a vehicle to the fleet inventory with its type, category, and current status.
          </p>
        </div>

        <VehicleForm mode="create" action={createVehicleAction} />
      </div>
    </DashboardShell>
  );
}