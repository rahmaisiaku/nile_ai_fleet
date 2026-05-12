import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  FileBarChart2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getUnitName, type UnitRelation } from "@/lib/data/approval-helpers";
import { unstable_noStore as noStore } from "next/cache";

type PendingQueueRow = {
  id: string;
  request_code: string;
  destination: string;
  purpose: string;
  unit: UnitRelation;
};

type ApprovalStats = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  reviewedCount: number;
};

async function getApproverDashboardData(): Promise<{
  stats: ApprovalStats;
  pendingQueue: PendingQueueRow[];
}> {
  noStore();

  const supabase = await createClient();

  const { data: pendingRequests } = await supabase
    .from("requests")
    .select("id")
    .eq("status", "pending");

  const { data: approvedRows } = await supabase
    .from("approvals")
    .select("id")
    .eq("decision", "approved");

  const { data: rejectedRows } = await supabase
    .from("approvals")
    .select("id")
    .eq("decision", "rejected");

  const { data: reviewedRows } = await supabase
    .from("approvals")
    .select("id");

  const { data: queueData } = await supabase
    .from("requests")
    .select(`
      id,
      request_code,
      destination,
      purpose,
      unit:units(name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    stats: {
      pendingCount: pendingRequests?.length ?? 0,
      approvedCount: approvedRows?.length ?? 0,
      rejectedCount: rejectedRows?.length ?? 0,
      reviewedCount: reviewedRows?.length ?? 0,
    },
    pendingQueue: (queueData ?? []) as PendingQueueRow[],
  };
}

export default async function ApproverDashboardPage() {
  const { stats, pendingQueue } = await getApproverDashboardData();

  return (
    <DashboardShell
      role="approver"
      title="Approver Dashboard"
      subtitle="Review transport requests and make fast, informed approval decisions."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/approver/requests"
            className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <StatCard
              label="Pending Requests"
              value={String(stats.pendingCount)}
              helper="Awaiting your review"
              icon={<Clock3 className="h-5 w-5" />}
            />
          </Link>

          <Link
            href="/approver/requests/history?decision=approved"
            className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <StatCard
              label="Approved Requests"
              value={String(stats.approvedCount)}
              helper="Requests approved so far"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </Link>

          <Link
            href="/approver/requests/history?decision=rejected"
            className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <StatCard
              label="Rejected Requests"
              value={String(stats.rejectedCount)}
              helper="Requests declined so far"
              icon={<XCircle className="h-5 w-5" />}
            />
          </Link>

          <Link
            href="/approver/requests/history"
            className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <StatCard
              label="Reviewed Total"
              value={String(stats.reviewedCount)}
              helper="Total processed requests"
              icon={<FileBarChart2 className="h-5 w-5" />}
            />
          </Link>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Approval Queue Snapshot
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  A quick view of requests currently waiting for action.
                </p>
              </div>

              <Link
                href="/approver/requests"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {pendingQueue.length > 0 ? (
                pendingQueue.map((item) => (
                  <Link
                    key={item.id}
                    href={`/approver/requests/${item.id}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.request_code}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {item.destination}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {item.purpose}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Requesting unit: {getUnitName(item.unit)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status="Pending" />
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                          Open
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    No pending requests at the moment.
                  </p>

                  <Link
                    href="/dashboard/approver/history"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
                  >
                    View approval history
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Review Guidance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Consistent approval improves allocation speed and transparency.
                </p>
              </div>

              <Link
                href="/dashboard/approver/history"
                className="text-sm font-medium text-slate-600 hover:text-slate-950"
              >
                See history
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Confirm the request is clearly official and complete.",
                "Check destination, timing, and passenger count carefully.",
                "Use the AI insights as support, not as the final authority.",
                "Reject incomplete or unclear requests with a brief reason.",
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