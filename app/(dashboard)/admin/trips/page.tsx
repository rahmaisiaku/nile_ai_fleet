import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";

type TripMonitorRow = {
  id: string;
  actual_departure_at: string | null;
  actual_return_at: string | null;
  late_return: boolean;
  request:
    | {
        destination: string;
        status: string;
        request_code: string;
      }
    | {
        destination: string;
        status: string;
        request_code: string;
      }[]
    | null;
  allocation:
    | {
        driver:
          | {
              profile:
                | {
                    full_name: string;
                  }
                | {
                    full_name: string;
                  }[]
                | null;
            }
          | {
              profile:
                | {
                    full_name: string;
                  }
                | {
                    full_name: string;
                  }[]
                | null;
            }[]
          | null;
        vehicle:
          | {
              make: string | null;
              model: string | null;
              plate_no: string;
            }
          | {
              make: string | null;
              model: string | null;
              plate_no: string;
            }[]
          | null;
      }
    | {
        driver:
          | {
              profile:
                | {
                    full_name: string;
                  }
                | {
                    full_name: string;
                  }[]
                | null;
            }
          | {
              profile:
                | {
                    full_name: string;
                  }
                | {
                    full_name: string;
                  }[]
                | null;
            }[]
          | null;
        vehicle:
          | {
              make: string | null;
              model: string | null;
              plate_no: string;
            }
          | {
              make: string | null;
              model: string | null;
              plate_no: string;
            }[]
          | null;
      }[]
    | null;
};

type SearchParams = Promise<{
  status?: string;
  late?: string;
  page?: string;
}>;

const PAGE_SIZE = 10;

function getRequestInfo(request: TripMonitorRow["request"]) {
  const resolved = Array.isArray(request) ? request[0] : request;

  return {
    requestCode: resolved?.request_code ?? "N/A",
    destination: resolved?.destination ?? "Unknown Route",
    status: resolved?.status ?? "completed",
  };
}

function getAllocationInfo(allocation: TripMonitorRow["allocation"]) {
  const resolvedAllocation = Array.isArray(allocation)
    ? allocation[0]
    : allocation;

  const vehicle = Array.isArray(resolvedAllocation?.vehicle)
    ? resolvedAllocation?.vehicle[0]
    : resolvedAllocation?.vehicle;

  const driver = Array.isArray(resolvedAllocation?.driver)
    ? resolvedAllocation?.driver[0]
    : resolvedAllocation?.driver;

  const profile = Array.isArray(driver?.profile)
    ? driver?.profile[0]
    : driver?.profile;

  return {
    vehicleLabel:
      `${vehicle?.make ?? ""} ${vehicle?.model ?? ""} (${vehicle?.plate_no ?? ""})`.trim() ||
      "Unknown Vehicle",
    driverName: profile?.full_name ?? "Unknown Driver",
  };
}

function mapRequestStatus(
  status: string
): "Allocated" | "In Trip" | "Completed" | "Approved" | "Rejected" | "Pending" {
  switch (status) {
    case "allocated":
      return "Allocated";
    case "in_trip":
      return "In Trip";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "pending":
      return "Pending";
    default:
      return "Completed";
  }
}

function buildTripsHref(status?: string, late?: string, page = 1) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (late) params.set("late", late);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/admin/trips?${query}` : "/admin/trips";
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  noStore();

  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  const selectedStatus = resolvedSearchParams?.status?.trim() || "";
  const selectedLate = resolvedSearchParams?.late?.trim() || "";
  const currentPage = Math.max(Number(resolvedSearchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("trips")
    .select(
      `
      id,
      actual_departure_at,
      actual_return_at,
      late_return,
      request:requests(
        request_code,
        destination,
        status
      ),
      allocation:allocations(
        driver:drivers(
          profile:profiles(full_name)
        ),
        vehicle:vehicles(make, model, plate_no)
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (selectedStatus === "active") {
    query = query.in("request.status", ["allocated", "in_trip"]);
  } else if (selectedStatus) {
    query = query.eq("request.status", selectedStatus);
  }

  if (selectedLate === "yes") {
    query = query.eq("late_return", true);
  } else if (selectedLate === "no") {
    query = query.eq("late_return", false);
  }

  const { data, count } = await query;
  const trips = (data ?? []) as TripMonitorRow[];
  const totalPages = Math.max(Math.ceil((count ?? 0) / PAGE_SIZE), 1);

  return (
    <DashboardShell
      role="admin"
      title="Trips Monitor"
      subtitle="Track active, allocated, completed, and flagged transport movements."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Trip Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Current and recent trip activity across the fleet.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: "All", status: "", late: "" },
            { label: "Active", status: "active", late: "" },
            { label: "Allocated", status: "allocated", late: "" },
            { label: "In Trip", status: "in_trip", late: "" },
            { label: "Completed", status: "completed", late: "" },
            { label: "Late Only", status: "", late: "yes" },
          ].map((filter) => {
            const active =
              selectedStatus === filter.status && selectedLate === filter.late;

            return (
              <Link
                key={filter.label}
                href={buildTripsHref(filter.status, filter.late)}
                className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-blue-700 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1200px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-sm text-slate-500">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Trip ID</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Request Code</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Route</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Vehicle</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Driver</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Departure</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Return</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Late</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {trips.length > 0 ? (
                  trips.map((trip) => {
                    const requestInfo = getRequestInfo(trip.request);
                    const allocationInfo = getAllocationInfo(trip.allocation);

                    return (
                      <tr key={trip.id}>
                        <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                          {trip.id}
                        </td>
                        <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                          {requestInfo.requestCode}
                        </td>
                        <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                          {requestInfo.destination}
                        </td>
                        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                          {allocationInfo.vehicleLabel}
                        </td>
                        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                          {allocationInfo.driverName}
                        </td>
                        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                          {trip.actual_departure_at
                            ? new Date(trip.actual_departure_at).toLocaleString()
                            : "Not started"}
                        </td>
                        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                          {trip.actual_return_at
                            ? new Date(trip.actual_return_at).toLocaleString()
                            : "Not returned"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              trip.late_return
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {trip.late_return ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={mapRequestStatus(requestInfo.status)}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No trip activity found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={buildTripsHref(
                selectedStatus,
                selectedLate,
                Math.max(currentPage - 1, 1)
              )}
              className={`inline-flex rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition ${
                currentPage <= 1
                  ? "pointer-events-none opacity-50"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Previous
            </Link>

            <Link
              href={buildTripsHref(
                selectedStatus,
                selectedLate,
                Math.min(currentPage + 1, totalPages)
              )}
              className={`inline-flex rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition ${
                currentPage >= totalPages
                  ? "pointer-events-none opacity-50"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}