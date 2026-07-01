import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

type VehicleStatus =
  | "Available"
  | "Allocated"
  | "In Trip"
  | "Maintenance"
  | "Inactive";

type VehicleRow = {
  id: string;
  plate_no: string;
  make: string | null;
  model: string | null;
  type: string;
  category: string;
  status: string;
};

function mapVehicleStatus(status: string): VehicleStatus {
  switch (status) {
    case "allocated":
      return "Allocated";
    case "in_trip":
      return "In Trip";
    case "maintenance":
      return "Maintenance";
    case "inactive":
      return "Inactive";
    default:
      return "Available";
  }
}

function formatVehicleType(type: string): string {
  switch (type) {
    case "assigned":
      return "Assigned Vehicle";
    default:
      return "Pool Vehicle";
  }
}

function formatVehicleCategory(category: string): string {
  switch (category) {
    case "non_luxury":
      return "Non-Luxury";
    default:
      return "Luxury";
  }
}

function getVehicleName(vehicle: VehicleRow): string {
  return `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() || "No model";
}

function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const styles: Record<VehicleStatus, string> = {
    Available: "bg-emerald-50 text-emerald-700",
    Allocated: "bg-blue-50 text-blue-700",
    "In Trip": "bg-violet-50 text-violet-700",
    Maintenance: "bg-orange-50 text-orange-700",
    Inactive: "bg-slate-200 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default async function VehiclesPage() {
  noStore();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, plate_no, make, model, type, category, status")
    .order("created_at", { ascending: false });

  console.log({ vehiclesError: error });

  const vehicles = (data ?? []) as VehicleRow[];

  return (
    <DashboardShell
      role="admin"
      title="Vehicles"
      subtitle="Manage the university fleet, vehicle categories, and availability states."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Fleet Inventory
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              A structured view of assigned and pool vehicles in the system.
            </p>
          </div>

          <Link
            href="/admin/vehicles/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-700 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Vehicle
          </Link>
        </div>

        {/* Mobile card view */}
        <div className="mt-6 space-y-3 md:hidden">
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Plate No.
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">
                      {vehicle.plate_no}
                    </h3>
                  </div>

                  <VehicleStatusBadge
                    status={mapVehicleStatus(vehicle.status)}
                  />
                </div>

                <div className="mt-4 grid gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Model</p>
                    <p className="mt-1 font-medium text-slate-700">
                      {getVehicleName(vehicle)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Type</p>
                      <p className="mt-1 text-slate-700">
                        {formatVehicleType(vehicle.type)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Category
                      </p>
                      <p className="mt-1 text-slate-700">
                        {formatVehicleCategory(vehicle.category)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/admin/vehicles/${vehicle.id}/edit`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Vehicle
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              No vehicles found.
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left">
              <thead className="bg-slate-50">
                <tr className="text-sm text-slate-500">
                  <th className="px-4 py-3 font-medium">Plate No.</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-slate-700">
                        {vehicle.plate_no}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {getVehicleName(vehicle)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatVehicleType(vehicle.type)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatVehicleCategory(vehicle.category)}
                      </td>
                      <td className="px-4 py-4">
                        <VehicleStatusBadge
                          status={mapVehicleStatus(vehicle.status)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/edit`}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No vehicles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}