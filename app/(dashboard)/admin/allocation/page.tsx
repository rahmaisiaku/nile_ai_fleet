import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AIInsightsCard } from "@/components/ai/ai-insights-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";
import { getUnitName, type UnitRelation } from "@/lib/data/approval-helpers";
import { AllocationForm } from "@/components/forms/allocation-form";

type ApprovedRequestRow = {
  id: string;
  request_code: string;
  destination: string;
  passenger_count: number;
  unit: UnitRelation;
};

type AILogRow = {
  request_id: string;
  estimated_duration_minutes: number | null;
  recommended_vehicle_category: "luxury" | "non_luxury" | null;
  risk_flag: "low" | "medium" | "high" | null;
  reason: string | null;
};

type VehicleRow = {
  id: string;
  plate_no: string;
  make: string | null;
  model: string | null;
};

type DriverProfileRelation =
  | { full_name: string }
  | { full_name: string }[]
  | null;

type DriverRow = {
  id: string;
  profile: DriverProfileRelation;
};

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "N/A";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours > 0 ? `${hours}h ${remaining}m` : `${remaining}m`;
}

function formatRisk(
  risk: "low" | "medium" | "high" | null
): "Low" | "Medium" | "High" {
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Low";
}

function formatVehicle(category: "luxury" | "non_luxury" | null) {
  return category === "luxury" ? "Executive Sedan" : "Standard SUV / Mini Bus";
}

function getDriverLabel(profile: DriverProfileRelation) {
  const resolved = Array.isArray(profile) ? profile[0] : profile;
  return resolved?.full_name ?? "Unnamed Driver";
}

export default async function AllocationBoardPage() {
  noStore();

  const supabase = await createClient();

  const { data: approvedRequestsData, error: approvedRequestsError } =
    await supabase
      .from("requests")
      .select(
        `
        id,
        request_code,
        destination,
        passenger_count,
        unit:units(name)
      `
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false });

  const approvedRequests = (approvedRequestsData ?? []) as ApprovedRequestRow[];
  const requestIds = approvedRequests.map((request) => request.id);

  let aiLogs: AILogRow[] = [];
  if (requestIds.length > 0) {
    const { data: aiLogsData, error: aiLogsError } = await supabase
      .from("ai_logs")
      .select(
        "request_id, estimated_duration_minutes, recommended_vehicle_category, risk_flag, reason, created_at"
      )
      .in("request_id", requestIds)
      .order("created_at", { ascending: false });

    console.log({ aiLogsError });
    aiLogs = (aiLogsData ?? []) as AILogRow[];
  }

  const { data: vehiclesData, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("id, plate_no, make, model")
    .eq("status", "available")
    .order("created_at", { ascending: false });

  const { data: driversData, error: driversError } = await supabase
    .from("drivers")
    .select(
      `
      id,
      profile:profiles(full_name)
    `
    )
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  console.log({
    approvedRequestsError,
    vehiclesError,
    driversError,
  });

  const aiMap = new Map<string, AILogRow>();
  aiLogs.forEach((log) => {
    if (!aiMap.has(log.request_id)) {
      aiMap.set(log.request_id, log);
    }
  });

  const vehicleOptions = ((vehiclesData ?? []) as VehicleRow[]).map((vehicle) => ({
    id: vehicle.id,
    label:
      `${vehicle.make ?? ""} ${vehicle.model ?? ""} (${vehicle.plate_no})`.trim(),
  }));

  const driverOptions = ((driversData ?? []) as DriverRow[]).map((driver) => ({
    id: driver.id,
    label: getDriverLabel(driver.profile),
  }));

  return (
    <DashboardShell
      role="admin"
      title="Allocation Board"
      subtitle="Assign vehicles and drivers to approved transport requests."
    >
      <div className="grid gap-6">
        {approvedRequests.length > 0 ? (
          approvedRequests.map((row) => {
            const aiLog = aiMap.get(row.id);

            return (
              <div
                key={row.id}
                className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]"
              >
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {row.request_code}
                        </p>
                        <StatusBadge status="Approved" />
                      </div>

                      <p className="mt-3 text-sm text-slate-700">
                        Destination: {row.destination}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Unit: {getUnitName(row.unit)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Passengers: {row.passenger_count}
                      </p>
                    </div>

                    <AllocationForm
                      requestId={row.id}
                      vehicles={vehicleOptions}
                      drivers={driverOptions}
                    />
                  </div>
                </section>

                <AIInsightsCard
                  estimatedDuration={formatDuration(
                    aiLog?.estimated_duration_minutes ?? null
                  )}
                  recommendedVehicle={formatVehicle(
                    aiLog?.recommended_vehicle_category ?? null
                  )}
                  riskLevel={formatRisk(aiLog?.risk_flag ?? null)}
                  note={
                    aiLog?.reason ??
                    "No AI recommendation is available for this request yet."
                  }
                />
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Approved Requests Awaiting Allocation
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              No approved requests are waiting for allocation right now.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}