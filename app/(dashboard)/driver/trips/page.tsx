import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
type DriverTripRow = {
  id: string;
  actual_departure_at: string | null;
  actual_return_at: string | null;
  request:
    | { destination: string }
    | { destination: string }[]
    | null;
  allocation:
    | {
        driver_id: string;
        vehicle:
          | { make: string | null; model: string | null }
          | { make: string | null; model: string | null }[]
          | null;
      }
    | {
        driver_id: string;
        vehicle:
          | { make: string | null; model: string | null }
          | { make: string | null; model: string | null }[]
          | null;
      }[]
    | null;
};

function getDestination(request: DriverTripRow["request"]) {
  const resolved = Array.isArray(request) ? request[0] : request;
  return resolved?.destination ?? "Unknown Route";
}

function getVehicleLabel(allocation: DriverTripRow["allocation"]) {
  const resolvedAllocation = Array.isArray(allocation)
    ? allocation[0]
    : allocation;

  const vehicle = Array.isArray(resolvedAllocation?.vehicle)
    ? resolvedAllocation?.vehicle[0]
    : resolvedAllocation?.vehicle;

  return `${vehicle?.make ?? ""} ${vehicle?.model ?? ""}`.trim() || "Unknown Vehicle";
}

function getTripStatus(
  trip: Pick<DriverTripRow, "actual_departure_at" | "actual_return_at">
): "Allocated" | "In Trip" | "Completed" {
  if (trip.actual_return_at) return "Completed";
  if (trip.actual_departure_at) return "In Trip";
  return "Allocated";
}

export default async function DriverTripsPage() {
  noStore();

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  let trips: DriverTripRow[] = [];

  if (profile?.role === "driver") {
    const { data: driverRow } = await supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", profile.id)
      .single();

    if (driverRow) {
      const { data } = await supabase
        .from("trips")
        .select(`
          id,
          actual_departure_at,
          actual_return_at,
          request:requests(destination),
          allocation:allocations(
            driver_id,
            vehicle:vehicles(make, model)
          )
        `)
        .order("created_at", { ascending: false });

      const allTrips = (data ?? []) as DriverTripRow[];

      trips = allTrips.filter((trip) => {
        const allocation = Array.isArray(trip.allocation)
          ? trip.allocation[0]
          : trip.allocation;

        return allocation?.driver_id === driverRow.id;
      });
    }
  }

  return (
    <DashboardShell
      role="driver"
      title="Assigned Trips"
      subtitle="View and update trips assigned to this driver."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Driver Trip List
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Open any assigned trip to record movement and return updates.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Trip ID</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Departure</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {trips.length > 0 ? (
                trips.map((trip) => (
                  <tr key={trip.id}>
                    <td className="px-4 py-4 text-slate-700">{trip.id}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {getDestination(trip.request)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {getVehicleLabel(trip.allocation)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {trip.actual_departure_at
                        ? new Date(trip.actual_departure_at).toLocaleString()
                        : "Not started"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={getTripStatus(trip)} />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/driver/trips/${trip.id}`}
                        className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Open Trip
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
                    No assigned trips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}