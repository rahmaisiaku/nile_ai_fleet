type AIInsightsCardProps = {
  estimatedDuration: string;
  recommendedVehicle: string;
  riskLevel: "Low" | "Medium" | "High";
  note: string;
};

export function AIInsightsCard({
  estimatedDuration,
  recommendedVehicle,
  riskLevel,
  note,
}: AIInsightsCardProps) {
  const riskClass =
    riskLevel === "Low"
      ? "bg-emerald-50 text-emerald-700"
      : riskLevel === "Medium"
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">
          AI Insights
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Smart assistance based on current request details.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Estimated Duration
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {estimatedDuration}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Recommended Vehicle
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {recommendedVehicle}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Risk Level
            </p>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskClass}`}>
              {riskLevel}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>
        </div>
      </div>
    </div>
  );
}