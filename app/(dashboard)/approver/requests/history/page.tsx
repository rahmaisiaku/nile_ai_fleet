import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import {
  getRequestInfo,
  type RequestRelation,
} from "@/lib/data/approval-helpers";

type ApprovalHistoryRow = {
  id: string;
  decision: "approved" | "rejected";
  decided_at: string;
  request: RequestRelation;
};

type ApprovalHistoryPageProps = {
  searchParams?: Promise<{
    page?: string;
    decision?: string;
  }>;
};

const PAGE_SIZE = 50;

function buildHistoryHref(decision?: string, page = 1) {
  const params = new URLSearchParams();

  if (decision) {
    params.set("decision", decision);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/dashboard/approver/history?${query}`
    : "/dashboard/approver/history";
}

function getDecisionLabel(decision?: string) {
  switch (decision) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "All";
  }
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default async function ApprovalHistoryPage({
  searchParams,
}: ApprovalHistoryPageProps) {
  const resolvedSearchParams = await searchParams;

  const currentPage = Math.max(
    1,
    Number(resolvedSearchParams?.page ?? "1") || 1
  );

  const selectedDecision = resolvedSearchParams?.decision?.trim() || "";

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("approvals")
    .select(
      `
        id,
        decision,
        decided_at,
        request:requests(request_code, destination)
      `,
      { count: "exact" }
    )
    .order("decided_at", { ascending: false })
    .range(from, to);

  if (selectedDecision) {
    query = query.eq("decision", selectedDecision);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const approvals = (data ?? []) as ApprovalHistoryRow[];
  const totalRows = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <DashboardShell
      role="approver"
      title="Approval History"
      subtitle="Review previously processed requests."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Processed Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A historical view of requests that have already been reviewed.
              Current filter:{" "}
              <span className="font-medium text-slate-700">
                {getDecisionLabel(selectedDecision)}
              </span>
              .
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {totalRows > 0 ? (
              <>
                Showing{" "}
                <span className="font-medium text-slate-700">{from + 1}</span>
                {" - "}
                <span className="font-medium text-slate-700">
                  {Math.min(to + 1, totalRows)}
                </span>
                {" of "}
                <span className="font-medium text-slate-700">{totalRows}</span>
              </>
            ) : (
              "0 results"
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = selectedDecision === filter.value;

            return (
              <Link
                key={filter.label}
                href={buildHistoryHref(filter.value)}
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

        <div className="mt-6 rounded-2xl border border-slate-200">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-sm text-slate-500">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Request Code
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Destination
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Decision
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {approvals.length > 0 ? (
                  approvals.map((approval) => {
                    const requestInfo = getRequestInfo(approval.request);

                    return (
                      <tr key={approval.id}>
                        <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                          {requestInfo.request_code}
                        </td>
                        <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                          {requestInfo.destination}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={
                              approval.decision === "approved"
                                ? "Approved"
                                : "Rejected"
                            }
                          />
                        </td>
                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                          {new Date(approval.decided_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No approval history found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalRows > 0 && (
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page <span className="font-medium text-slate-700">{currentPage}</span>{" "}
              of <span className="font-medium text-slate-700">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <Link
                href={
                  hasPreviousPage
                    ? buildHistoryHref(selectedDecision, currentPage - 1)
                    : "#"
                }
                aria-disabled={!hasPreviousPage}
                className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition ${
                  hasPreviousPage
                    ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                Previous
              </Link>

              <Link
                href={
                  hasNextPage
                    ? buildHistoryHref(selectedDecision, currentPage + 1)
                    : "#"
                }
                aria-disabled={!hasNextPage}
                className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium transition ${
                  hasNextPage
                    ? "border border-slate-200 bg-slate-900 text-white hover:bg-slate-800"
                    : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}