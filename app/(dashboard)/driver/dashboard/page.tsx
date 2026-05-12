import { Clock3, Route, ShieldCheck, Truck } from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";

type CurrentTripRow = {
  id: string;
  request: {
    destination: string;
  } | {
    destination: string;
  }[] | null;
  allocation: {
    vehicle: {
      make: string | null;
      model: string | null;
    } | {
      make: string | null;
      model: string | null;
    }[] | null;
  } | {
    vehicle: {
      make: string | null;
      model: string | null;
    } | {
      make: string | null;
      model: string | null;
    }[] | null;
  }[] | null;
  actual_departure_at: string | null;
  actual_return_at: string | null;
};

function getDestination(
  request: CurrentTripRow["request"]
): string {
  const resolved = Array.isArray(request) ? request[0] : request;
  return resolved?.destination ?? "Unknown Route";
}

function getVehicleLabel(
  allocation: CurrentTripRow["allocation"]
): string {
  const resolvedAllocation = Array.isArray(allocation)
    ? allocation[0]
    : allocation;

  const vehicle = Array.isArray(resolvedAllocation?.vehicle)
    ? resolvedAllocation?.vehicle[0]
    : resolvedAllocation?.vehicle;

  return `${vehicle?.make ?? ""} ${vehicle?.model ?? ""}`.trim() || "Unknown Vehicle";
}

export default async function DriverDashboardPage() {
  noStore();

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  let assignedTripsCount = 0;
  let activeTripsCount = 0;
  let pendingStartCount = 0;
  let completedTodayCount = 0;
  let currentTrip: CurrentTripRow | null = null;

  if (profile?.role === "driver") {
    const { data: driverRow } = await supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", profile.id)
      .single();

    if (driverRow) {
      const { data: assignedTrips } = await supabase
        .from("allocations")
        .select("id, request:requests(status)")
        .eq("driver_id", driverRow.id);

      assignedTripsCount = assignedTrips?.length ?? 0;

      const { data: tripRows } = await supabase
        .from("trips")
        .select(`
          id,
          actual_departure_at,
          actual_return_at,
          request:requests(destination, status),
          allocation:allocations(
            vehicle:vehicles(make, model)
          )
        `)
        .order("created_at", { ascending: false });

      const typedTrips = (tripRows ?? []) as CurrentTripRow[];

      const activeTrips = typedTrips.filter(
        (trip) => trip.actual_departure_at && !trip.actual_return_at
      );
      const pendingTrips = typedTrips.filter(
        (trip) => !trip.actual_departure_at && !trip.actual_return_at
      );
      const completedTrips = typedTrips.filter(
        (trip) => !!trip.actual_return_at
      );

      activeTripsCount = activeTrips.length;
      pendingStartCount = pendingTrips.length;
      completedTodayCount = completedTrips.length;
      currentTrip = activeTrips[0] ?? pendingTrips[0] ?? null;
    }
  }

  return (
    <DashboardShell
      role="driver"
      title="Driver Dashboard"
      subtitle="View assigned trips, monitor trip progress, and update transport execution records."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Assigned Trips"
            value={String(assignedTripsCount)}
            helper="Trips currently assigned to this driver"
            icon={<Truck className="h-5 w-5" />}
          />
          <StatCard
            label="Active Trips"
            value={String(activeTripsCount)}
            helper="Trip currently in progress"
            icon={<Route className="h-5 w-5" />}
          />
          <StatCard
            label="Pending Start"
            value={String(pendingStartCount)}
            helper="Trips waiting for departure"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <StatCard
            label="Completed"
            value={String(completedTodayCount)}
            helper="Trips successfully closed"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Current Trip Snapshot
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Operational summary of the most recent assigned trip.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              {currentTrip ? (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {currentTrip.id}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Route: {getDestination(currentTrip.request)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Vehicle: {getVehicleLabel(currentTrip.allocation)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Departure:{" "}
                      {currentTrip.actual_departure_at
                        ? new Date(currentTrip.actual_departure_at).toLocaleString()
                        : "Not started"}
                    </p>
                  </div>

                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                    {currentTrip.actual_departure_at && !currentTrip.actual_return_at
                      ? "In Trip"
                      : "Allocated"}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No assigned trip available right now.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Driver Notes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Keep trip records accurate and up to date.
            </p>

            <div className="mt-5 space-y-3">
              {[
                "Start the trip only when movement has actually begun.",
                "Record the trip return immediately after arrival.",
                "Delays and unusual events should be noted clearly.",
                "Trip completion updates feed the admin monitoring dashboard.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}