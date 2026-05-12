import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";

export type StaffDashboardAISummary = {
  estimatedDuration: string;
  recommendedVehicle: string;
  note: string;
};

export async function getStaffDashboardAISummary(): Promise<StaffDashboardAISummary> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "staff") {
    return {
      estimatedDuration: "N/A",
      recommendedVehicle: "N/A",
      note: "No recent AI activity available.",
    };
  }

  const { data } = await supabase
    .from("requests")
    .select(`
      id,
      ai_logs (
        estimated_duration_minutes,
        recommended_vehicle_category,
        reason,
        created_at
      )
    `)
    .eq("staff_profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const aiLog = Array.isArray(data?.ai_logs) ? data.ai_logs[0] : null;

  if (!aiLog) {
    return {
      estimatedDuration: "N/A",
      recommendedVehicle: "N/A",
      note: "Submit a request to start seeing AI-generated transport insights.",
    };
  }

  const minutes = aiLog.estimated_duration_minutes ?? 0;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  const estimatedDuration =
    minutes > 0
      ? hours > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${remainingMinutes}m`
      : "N/A";

  const recommendedVehicle =
    aiLog.recommended_vehicle_category === "luxury"
      ? "Executive Sedan"
      : "Standard SUV / Mini Bus";

  return {
    estimatedDuration,
    recommendedVehicle,
    note:
      aiLog.reason ?? "Latest AI recommendation is available for your recent request.",
  };
}