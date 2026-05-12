import { unstable_noStore as noStore } from "next/cache";
import { BarChart3, CarFront, Clock3, Route } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { createClient } from "@/lib/supabase/server";

type TripDurationRow = {
  actual_departure_at: string | null;
  actual_return_at: string | null;
};

function calculateAverageDurationMinutes(trips: TripDurationRow[]): number {
  const durations = trips
    .filter(
      (trip) => trip.actual_departure_at !== null && trip.actual_return_at !== null
    )
    .map((trip) => {
      const start = new Date(trip.actual_departure_at as string).getTime();
      const end = new Date(trip.actual_return_at as string).getTime();
      return Math.max(0, Math.round((end - start) / 60000));
    });

  if (durations.length === 0) return 0;

  const total = durations.reduce((sum, value) => sum + value, 0);
  return Math.round(total / durations.length);
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours > 0 ? `${hours}h ${remaining}m` : `${remaining}m`;
}

export default async function ReportsPage() {
  noStore();

  const supabase = await createClient();

  const { data: tripsData, error: tripsError } = await supabase
    .from("trips")
    .select("id, actual_departure_at, actual_return_at, late_return");

  const { data: vehiclesData, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("id, status");

  const { data: aiLogsData, error: aiLogsError } = await supabase
    .from("ai_logs")
    .select("id");

  const trips = (tripsData ?? []) as Array<
    TripDurationRow & { id: string; late_return: boolean }
  >;
  const vehicles = (vehiclesData ?? []) as Array<{ id: string; status: string }>;
  const aiLogs = aiLogsData ?? [];

  const tripsThisMonth = trips.length;
  const completedTrips = trips.filter((trip) => !!trip.actual_return_at);
  const lateReturns = trips.filter((trip) => trip.late_return).length;
  const activeTrips = trips.filter(
    (trip) => !!trip.actual_departure_at && !trip.actual_return_at
  ).length;

  const utilizedVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "allocated" || vehicle.status === "in_trip"
  ).length;

  const vehicleUtilization =
    vehicles.length > 0
      ? Math.round((utilizedVehicles / vehicles.length) * 100)
      : 0;

  const averageDurationMinutes = calculateAverageDurationMinutes(trips);
  const aiCoverage =
    tripsThisMonth > 0 ? Math.round((aiLogs.length / tripsThisMonth) * 100) : 0;

  return (
    <DashboardShell
      role="admin"
      title="Reports"
      subtitle="Review transport trends, usage performance, and operational summaries."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Trips Recorded"
            value={String(tripsThisMonth)}
            helper="Total fleet movements recorded"
            icon={<Route className="h-5 w-5" />}
          />
          <StatCard
            label="Vehicle Utilization"
            value={`${vehicleUtilization}%`}
            helper="Current share of fleet in use"
            icon={<CarFront className="h-5 w-5" />}
          />
          <StatCard
            label="Average Duration"
            value={formatDuration(averageDurationMinutes)}
            helper="Average completed trip time"
            icon={<Clock3 className="h-5 w-5" />}
          />
          <StatCard
            label="AI Coverage"
            value={`${aiCoverage}%`}
            helper="Requests with AI logs recorded"
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Operational Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Summary-level insight for reporting and administrative review.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm leading-6 text-slate-600">
                  Completed trips: <span className="font-medium">{completedTrips.length}</span>
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm leading-6 text-slate-600">
                  Active trips: <span className="font-medium">{activeTrips}</span>
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm leading-6 text-slate-600">
                  Late returns flagged: <span className="font-medium">{lateReturns}</span>
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-sm leading-6 text-slate-600">
                  Vehicles currently in use: <span className="font-medium">{utilizedVehicles}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Reporting Note
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This page now reflects real trip, fleet, and AI activity from the
              system database. It can be extended later with charts, date
              filters, export options, and monthly trend breakdowns.
            </p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}