import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import { createClient } from "@/lib/supabase/server";

type RequestStatusLabel =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Allocated"
  | "In Trip"
  | "Completed";

type SearchParams = Promise<{
  status?: string;
  page?: string;
}>;

const PAGE_SIZE = 20;

function mapStatus(status: string): RequestStatusLabel {
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

function getFilterLabel(status?: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "allocated":
      return "Allocated";
    case "in_trip":
      return "In Trip";
    case "completed":
      return "Completed";
    case "rejected":
      return "Rejected";
    default:
      return "All";
  }
}

function buildMyRequestsHref(status?: string, page = 1) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/staff/requests/my-requests?${query}` : "/staff/requests/my-requests";
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Allocated", value: "allocated" },
  { label: "In Trip", value: "in_trip" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;

  const selectedStatus = resolvedSearchParams?.status?.trim() || "";
  const currentPage = Math.max(Number(resolvedSearchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let requests: Array<{
    id: string;
    request_code: string;
    destination: string;
    purpose: string;
    created_at: string;
    status: RequestStatusLabel;
  }> = [];

  let totalPages = 1;

  if (profile) {
    let query = supabase
      .from("requests")
      .select("id, request_code, destination, purpose, created_at, status", {
        count: "exact",
      })
      .eq("staff_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (selectedStatus) {
      query = query.eq("status", selectedStatus);
    }

    const { data, count } = await query;

    requests =
      data?.map((row) => ({
        id: row.id,
        request_code: row.request_code,
        destination: row.destination,
        purpose: row.purpose,
        created_at: new Date(row.created_at).toLocaleDateString(),
        status: mapStatus(row.status),
      })) ?? [];

    totalPages = Math.max(Math.ceil((count ?? 0) / PAGE_SIZE), 1);
  }

  return (
    <DashboardShell
      role="staff"
      title="My Requests"
      subtitle="Track all requests submitted by this staff user."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Submitted Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your transport request history. Current filter:{" "}
              <span className="font-medium text-slate-700">
                {getFilterLabel(selectedStatus)}
              </span>
              .
            </p>
          </div>

          <Link
            href="/staff/requests/new"
            className="inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            New Request
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = selectedStatus === filter.value;

            return (
              <Link
                key={filter.label}
                href={buildMyRequestsHref(filter.value)}
                className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Request Code</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-4 text-slate-700">
                      {request.request_code}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {request.destination}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {request.purpose}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {request.created_at}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/staff/requests/${request.id}`}
                        className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        View
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
                    No transport requests found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={buildMyRequestsHref(
                selectedStatus,
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
              href={buildMyRequestsHref(
                selectedStatus,
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