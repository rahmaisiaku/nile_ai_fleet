import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AIInsightsCard } from "@/components/ai/ai-insights-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import { ApprovalReviewForm } from "@/components/forms/approval-review-form";

type ReviewRequestPageProps = {
  params: Promise<{ id: string }>;
};

type RequestUnit = {
  name: string;
};

type RequestRow = {
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
  unit: RequestUnit | RequestUnit[] | null;
};

type AILogRow = {
  estimated_duration_minutes: number | null;
  recommended_vehicle_category: "luxury" | "non_luxury" | null;
  risk_flag: "low" | "medium" | "high" | null;
  reason: string | null;
};

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "N/A";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours > 0 ? `${hours}h ${remaining}m` : `${remaining}m`;
}

function formatRisk(risk: "low" | "medium" | "high" | null): "Low" | "Medium" | "High" {
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Low";
}

function formatVehicle(category: "luxury" | "non_luxury" | null) {
  return category === "luxury" ? "Executive Sedan" : "Standard SUV / Mini Bus";
}

export default async function ReviewRequestPage({
  params,
}: ReviewRequestPageProps) {
  const { id } = await params;
  const supabase = await createClient();

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
      unit:units(name)
    `)
    .eq("id", id)
    .single<RequestRow>();

  if (requestError || !request) {
    notFound();
  }

  const { data: aiLog } = await supabase
    .from("ai_logs")
    .select("estimated_duration_minutes, recommended_vehicle_category, risk_flag, reason")
    .eq("request_id", request.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AILogRow>();

  return (
    <DashboardShell
      role="approver"
      title="Review Request"
      subtitle="Inspect the full request details and make an approval decision."
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Request Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Full transport request information for approval review.
                </p>
              </div>

              <StatusBadge status="Pending" />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Request Code
                </p>
                <p className="mt-2 text-sm text-slate-900">{request.request_code}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Destination
                </p>
                <p className="mt-2 text-sm text-slate-900">{request.destination}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Purpose
                </p>
                <p className="mt-2 text-sm text-slate-900">{request.purpose}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Requesting Unit
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {Array.isArray(request.unit)
                    ? request.unit[0]?.name ?? "Not assigned"
                    : request.unit?.name ?? "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Departure
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {request.departure_date}, {request.departure_time}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Expected Return
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {request.expected_return_date ?? "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Passenger Count
                </p>
                <p className="mt-2 text-sm text-slate-900">{request.passenger_count}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Trip Type
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {request.trip_type ?? "Not specified"}
                </p>
              </div>
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Approval Action
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Approve complete requests or reject with a clear reason.
            </p>

            <ApprovalReviewForm requestId={request.id} />
          </div>
        </section>

        <div className="space-y-6">
          <AIInsightsCard
            estimatedDuration={formatDuration(aiLog?.estimated_duration_minutes ?? null)}
            recommendedVehicle={formatVehicle(aiLog?.recommended_vehicle_category ?? null)}
            riskLevel={formatRisk(aiLog?.risk_flag ?? null)}
            note={
              aiLog?.reason ??
              "No AI insight is available for this request yet."
            }
          />

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Reviewer Note
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              AI outputs should support your review, but final approval should
              still reflect policy, urgency, and institutional transport needs.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}