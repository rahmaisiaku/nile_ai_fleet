import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type StaffRequestDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type RequestUnit = {
  name: string;
};

type AllocatedVehicle = {
  plate_no: string;
  make: string | null;
  model: string | null;
  type: string;
  category: string;
};

type DriverProfile = {
  full_name: string;
  email: string;
};

type AllocatedDriver = {
  id: string;
  phone: string | null;
  is_available: boolean;
  profile: DriverProfile | DriverProfile[] | null;
};

type RequestDetailsRow = {
  id: string;
  request_code: string;
  destination: string;
  purpose: string;
  passenger_count: number;
  departure_date: string;
  departure_time: string;
  expected_return_date: string | null;
  trip_type: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  unit: RequestUnit | RequestUnit[] | null;
};

type AllocationRow = {
  allocated_at: string;
  vehicle: AllocatedVehicle | AllocatedVehicle[] | null;
  driver: AllocatedDriver | AllocatedDriver[] | null;
};

type TripRow = {
  actual_departure_at: string | null;
  actual_return_at: string | null;
  driver_note: string | null;
  late_return: boolean | null;
};

function mapStatus(
  status: string
): "Pending" | "Approved" | "Rejected" | "Allocated" | "In Trip" | "Completed" {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "allocated":
      return "Allocated";
    case "in_trip":
      return "In Trip";
    default:
      return "Completed";
  }
}

function getUnitName(unit: RequestUnit | RequestUnit[] | null) {
  return Array.isArray(unit)
    ? unit[0]?.name ?? "Not assigned"
    : unit?.name ?? "Not assigned";
}

function getVehicleInfo(vehicle: AllocatedVehicle | AllocatedVehicle[] | null) {
  const resolved = Array.isArray(vehicle) ? vehicle[0] : vehicle;

  return {
    plateNo: resolved?.plate_no ?? "Not assigned",
    make: resolved?.make ?? "",
    model: resolved?.model ?? "",
    type: resolved?.type ?? "",
    category: resolved?.category ?? "",
  };
}

function getDriverInfo(driver: AllocatedDriver | AllocatedDriver[] | null) {
  const resolvedDriver = Array.isArray(driver) ? driver[0] : driver;
  const resolvedProfile = Array.isArray(resolvedDriver?.profile)
    ? resolvedDriver.profile[0]
    : resolvedDriver?.profile;

  return {
    phone: resolvedDriver?.phone ?? "No phone",
    fullName: resolvedProfile?.full_name ?? "Driver not assigned",
    email: resolvedProfile?.email ?? "No email",
  };
}

function formatVehicleType(type: string) {
  return type === "assigned" ? "Assigned Vehicle" : "Pool Vehicle";
}

function formatVehicleCategory(category: string) {
  return category === "non_luxury" ? "Non-Luxury" : "Luxury";
}

function getAssignmentState(
  requestStatus: string,
  allocation: AllocationRow | null
) {
  if (requestStatus === "rejected") {
    return {
      label: "Request Rejected",
      description: "Your request was not approved.",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (allocation) {
    return {
      label: "Fully Assigned",
      description: "A vehicle and driver have been allocated to this request.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (requestStatus === "approved") {
    return {
      label: "Approved, Awaiting Allocation",
      description:
        "Your request has been approved and is waiting for vehicle and driver assignment.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (requestStatus === "pending") {
    return {
      label: "Awaiting Review",
      description: "Your request is still pending approval.",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (requestStatus === "in_trip") {
    return {
      label: "Trip In Progress",
      description: "Your assigned trip is currently in progress.",
      tone: "border-violet-200 bg-violet-50 text-violet-700",
    };
  }

  return {
    label: "Trip Completed",
    description: "This trip has been completed.",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-sm text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default async function StaffRequestDetailsPage({
  params,
}: StaffRequestDetailsPageProps) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  if (!profile || profile.role !== "staff") {
    notFound();
  }

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select(`
      id,
      request_code,
      destination,
      purpose,
      passenger_count,
      departure_date,
      departure_time,
      expected_return_date,
      trip_type,
      notes,
      status,
      created_at,
      unit:units(name)
    `)
    .eq("id", id)
    .eq("staff_profile_id", profile.id)
    .single<RequestDetailsRow>();

  if (requestError || !request) {
    notFound();
  }

  const { data: allocation, error: allocationError } = await supabase
    .from("allocations")
    .select(`
      allocated_at,
      vehicle:vehicles!allocations_vehicle_id_fkey(
        plate_no,
        make,
        model,
        type,
        category
      ),
      driver:drivers!allocations_driver_id_fkey(
        id,
        phone,
        is_available,
        profile:profiles!drivers_profile_id_fkey(
          full_name,
          email
        )
      )
    `)
    .eq("request_id", request.id)
    .maybeSingle<AllocationRow>();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("actual_departure_at, actual_return_at, driver_note, late_return")
    .eq("request_id", request.id)
    .maybeSingle<TripRow>();

  if (allocationError || tripError) {
    return (
      <DashboardShell
        role="staff"
        title="Request Details"
        subtitle="Could not load assignment details."
      >
        <pre className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-slate-800">
{JSON.stringify(
  {
    requestId: request.id,
    allocationError,
    tripError,
  },
  null,
  2
)}
        </pre>
      </DashboardShell>
    );
  }

  const vehicle = getVehicleInfo(allocation?.vehicle ?? null);
  const driver = getDriverInfo(allocation?.driver ?? null);
  const assignmentState = getAssignmentState(request.status, allocation ?? null);

  return (
    <DashboardShell
      role="staff"
      title="Request Details"
      subtitle="View the full status and lifecycle of your submitted request."
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Request Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Full details of the transport request you submitted.
                </p>
              </div>

              <StatusBadge status={mapStatus(request.status)} />
            </div>

            <div
              className={`mt-6 rounded-2xl border px-4 py-4 ${assignmentState.tone}`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">
                    {assignmentState.label}
                  </p>
                  <p className="mt-1 text-sm">{assignmentState.description}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailItem
                label="Request Code"
                value={request.request_code}
                icon={FileText}
              />
              <DetailItem
                label="Destination"
                value={request.destination}
                icon={MapPin}
              />
              <DetailItem
                label="Purpose"
                value={request.purpose}
                icon={FileText}
              />
              <DetailItem
                label="Requesting Unit"
                value={getUnitName(request.unit)}
                icon={ShieldCheck}
              />
              <DetailItem
                label="Departure Date"
                value={request.departure_date}
                icon={CalendarDays}
              />
              <DetailItem
                label="Departure Time"
                value={request.departure_time}
                icon={Clock3}
              />
              <DetailItem
                label="Expected Return Date"
                value={request.expected_return_date ?? "Not provided"}
                icon={CalendarDays}
              />
              <DetailItem
                label="Passenger Count"
                value={request.passenger_count}
                icon={UserRound}
              />
              <DetailItem
                label="Trip Type"
                value={request.trip_type ?? "Not specified"}
                icon={CarFront}
              />
              <DetailItem
                label="Submitted On"
                value={new Date(request.created_at).toLocaleString()}
                icon={Clock3}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Additional Notes
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {request.notes?.trim() || "No additional notes provided."}
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Allocation Status
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Vehicle and driver assignment details.
            </p>

            <div className="mt-5 space-y-4">
              {allocation ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Allocated At
                    </p>
                    <p className="mt-2 text-sm text-slate-900">
                      {allocation.allocated_at
                        ? new Date(allocation.allocated_at).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                        <CarFront className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Assigned Vehicle
                        </p>
                        <p className="text-xs text-slate-500">
                          Full fleet assignment details
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Vehicle
                        </p>
                        <p className="mt-1 text-slate-900">
                          {[vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
                            "Not assigned"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Plate Number
                        </p>
                        <p className="mt-1 text-slate-900">{vehicle.plateNo}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Type
                        </p>
                        <p className="mt-1 text-slate-900">
                          {vehicle.type
                            ? formatVehicleType(vehicle.type)
                            : "Not specified"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Category
                        </p>
                        <p className="mt-1 text-slate-900">
                          {vehicle.category
                            ? formatVehicleCategory(vehicle.category)
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Assigned Driver
                        </p>
                        <p className="text-xs text-slate-500">
                          Contact details
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Driver Name
                        </p>
                        <p className="mt-1 text-slate-900">{driver.fullName}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Email
                        </p>
                        <p className="mt-1 text-slate-900">{driver.email}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Phone
                        </p>
                        <p className="mt-1 text-slate-900">{driver.phone}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-600">
                    No vehicle or driver has been allocated yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Trip Execution
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Live trip progress and completion details.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              {trip ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Actual Departure
                    </p>
                    <p className="mt-2 text-sm text-slate-900">
                      {trip.actual_departure_at
                        ? new Date(trip.actual_departure_at).toLocaleString()
                        : "Not started"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Actual Return
                    </p>
                    <p className="mt-2 text-sm text-slate-900">
                      {trip.actual_return_at
                        ? new Date(trip.actual_return_at).toLocaleString()
                        : "Not returned yet"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Late Return
                    </p>
                    <p className="mt-2 text-sm text-slate-900">
                      {trip.late_return ? "Yes" : "No"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Driver Note
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {trip.driver_note?.trim() || "No driver note available."}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Trip execution has not started yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}