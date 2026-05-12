import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getUnitName, type UnitRelation } from "@/lib/data/approval-helpers";

type PendingRequestRow = {
  id: string;
  request_code: string;
  destination: string;
  purpose: string;
  departure_date: string;
  unit: UnitRelation;
};

export default async function PendingRequestsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("requests")
    .select(`
      id,
      request_code,
      destination,
      purpose,
      departure_date,
      unit:units(name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingRequests = (data ?? []) as PendingRequestRow[];

  return (
    <DashboardShell
      role="approver"
      title="Pending Requests"
      subtitle="Review requests awaiting approval action."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Approval Queue
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a request to inspect details and make a decision.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Request Code</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
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
                      {getUnitName(request.unit)}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {request.departure_date}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status="Pending" />
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/approver/requests/${request.id}`}
                        className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No pending requests available right now.
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