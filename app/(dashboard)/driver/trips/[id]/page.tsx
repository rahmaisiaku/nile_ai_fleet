import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import { DriverTripActionForm } from "@/components/forms/driver-trip-action-form";

type DriverTripDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type TripDetailsRow = {
  id: string;
  actual_departure_at: string | null;
  actual_return_at: string | null;
  driver_note: string | null;
  late_return: boolean;
  request: {
    id: string;
    destination: string;
    expected_return_date: string | null;
    passenger_count: number;
  } | {
    id: string;
    destination: string;
    expected_return_date: string | null;
    passenger_count: number;
  }[] | null;
  allocation: {
    driver_id: string;
    vehicle: {
      make: string | null;
      model: string | null;
      plate_no: string;
    } | {
      make: string | null;
      model: string | null;
      plate_no: string;
    }[] | null;
  } | {
    driver_id: string;
    vehicle: {
      make: string | null;
      model: string | null;
      plate_no: string;
    } | {
      make: string | null;
      model: string | null;
      plate_no: string;
    }[] | null;
  }[] | null;
};

function getRequestInfo(request: TripDetailsRow["request"]) {
  const resolved = Array.isArray(request) ? request[0] : request;

  return {
    id: resolved?.id ?? "",
    destination: resolved?.destination ?? "Unknown Route",
    expectedReturnDate: resolved?.expected_return_date ?? null,
    passengerCount: resolved?.passenger_count ?? 0,
  };
}

function getVehicleInfo(allocation: TripDetailsRow["allocation"]) {
  const resolvedAllocation = Array.isArray(allocation)
    ? allocation[0]
    : allocation;

  const vehicle = Array.isArray(resolvedAllocation?.vehicle)
    ? resolvedAllocation?.vehicle[0]
    : resolvedAllocation?.vehicle;

  return {
    driverId: resolvedAllocation?.driver_id ?? "",
    label:
      `${vehicle?.make ?? ""} ${vehicle?.model ?? ""} (${vehicle?.plate_no ?? ""})`.trim() ||
      "Unknown Vehicle",
  };
}

function getStatus(
  actualDepartureAt: string | null,
  actualReturnAt: string | null
): "Allocated" | "In Trip" | "Completed" {
  if (actualReturnAt) return "Completed";
  if (actualDepartureAt) return "In Trip";
  return "Allocated";
}

export default async function DriverTripDetailsPage({
  params,
}: DriverTripDetailsPageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  

  if (!profile || profile.role !== "driver") {
    notFound();
  }

  const { data: driverRow } = await supabase
    .from("drivers")
    .select("id")
    .eq("profile_id", profile.id)
    .single();

  if (!driverRow) {
    // notFound();
    return (
    <pre className="p-6 text-sm">
      {JSON.stringify({ step: "driver row missing", profile }, null, 2)}
    </pre>
  );
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .select(`
      id,
      actual_departure_at,
      actual_return_at,
      driver_note,
      late_return,
      request:requests(
        id,
        destination,
        expected_return_date,
        passenger_count
      ),
      allocation:allocations(
        driver_id,
        vehicle:vehicles(make, model, plate_no)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !trip) {
    notFound();
  }

  const typedTrip = trip as TripDetailsRow;
  const requestInfo = getRequestInfo(typedTrip.request);
  const vehicleInfo = getVehicleInfo(typedTrip.allocation);

  if (vehicleInfo.driverId !== driverRow.id) {
    notFound();
  }

  return (
    <DashboardShell
      role="driver"
      title="Trip Details"
      subtitle="Record trip departure, progress, and completion updates."
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Assigned Trip Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Verify trip details before updating status.
                </p>
              </div>

              <StatusBadge
                status={getStatus(
                  typedTrip.actual_departure_at,
                  typedTrip.actual_return_at
                )}
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Trip ID
                </p>
                <p className="mt-2 text-sm text-slate-900">{typedTrip.id}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Destination
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {requestInfo.destination}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Vehicle
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {vehicleInfo.label}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Actual Departure
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {typedTrip.actual_departure_at
                    ? new Date(typedTrip.actual_departure_at).toLocaleString()
                    : "Not started"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Expected Return Date
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {requestInfo.expectedReturnDate ?? "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Passenger Count
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {requestInfo.passengerCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Trip Action Panel
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update departure and return records accurately.
            </p>

            <div className="mt-6">
              <DriverTripActionForm
                tripId={typedTrip.id}
                hasStarted={!!typedTrip.actual_departure_at}
                hasEnded={!!typedTrip.actual_return_at}
              />
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Driver Reminder
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Only start the trip when actual movement begins, and only end the
              trip when the route has been fully completed and the vehicle has
              returned.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Trip Notes
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {typedTrip.driver_note?.trim() || "No driver note has been recorded yet."}
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Late Return: {typedTrip.late_return ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
