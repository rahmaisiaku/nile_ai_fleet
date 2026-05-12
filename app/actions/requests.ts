"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import { getRequestInsights } from "@/lib/ai/request-insights";
import {
  getProfileIdsByRole,
  sendBulkNotifications,
} from "@/lib/notifications/send-notification";

export type RequestFormState = {
  error?: string;
  success?: string;
};

function makeRequestCode() {
  return `REQ-${Date.now()}`;
}

function getHour(value: string): number | undefined {
  if (!value) return undefined;

  const hour = Number(value.split(":")[0]);
  return Number.isNaN(hour) ? undefined : hour;
}

export async function createTransportRequest(
  prevState: RequestFormState,
  formData: FormData
): Promise<RequestFormState> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "You must be logged in to submit a request." };
  }

  if (profile.role !== "staff") {
    return { error: "Only staff users can submit transport requests." };
  }

  const { data: existingActiveRequest, error: existingRequestError } =
    await supabase
      .from("requests")
      .select("id, request_code, status")
      .eq("staff_profile_id", profile.id)
      .in("status", ["pending", "approved", "allocated", "in_trip"])
      .limit(1)
      .maybeSingle();

  if (existingRequestError) {
    return { error: "Unable to validate existing requests right now." };
  }

  if (existingActiveRequest) {
    return {
      error:
        "You already have an active request in the system. Complete or resolve it before creating another one.",
    };
  }

  const destinationArea = String(formData.get("destinationArea") ?? "").trim();
  const destinationLandmark = String(formData.get("destinationLandmark") ?? "").trim();
  const tripCategory = String(formData.get("tripCategory") ?? "").trim();
  const purposeDetails = String(formData.get("purposeDetails") ?? "").trim();
  const departureDate = String(formData.get("departureDate") ?? "").trim();
  const departureTime = String(formData.get("departureTime") ?? "").trim();
  const expectedReturnDate = String(formData.get("returnDate") ?? "").trim();
  const expectedReturnTime = String(formData.get("returnTime") ?? "").trim();
  const passengerCount = Number(formData.get("passengerCount") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();
  const unitId = String(formData.get("unit") ?? "").trim();

  const destination = [destinationArea, destinationLandmark]
    .filter(Boolean)
    .join(", ");

  const purpose = [tripCategory, purposeDetails]
    .filter(Boolean)
    .join(" - ");

  if (
    !destinationArea ||
    !destinationLandmark ||
    !tripCategory ||
    !purposeDetails ||
    !departureDate ||
    !departureTime ||
    !expectedReturnDate ||
    !expectedReturnTime ||
    passengerCount < 1
  ) {
    return { error: "Please complete all required request fields." };
  }

  const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
  const returnDateTime = new Date(`${expectedReturnDate}T${expectedReturnTime}:00`);

  if (
    Number.isNaN(departureDateTime.getTime()) ||
    Number.isNaN(returnDateTime.getTime())
  ) {
    return { error: "Invalid departure or return date/time." };
  }

  if (returnDateTime <= departureDateTime) {
    return { error: "Expected return date/time must be later than departure date/time." };
  }

  const insights = getRequestInsights({
    destination,
    destinationArea,
    destinationLandmark,
    passengerCount,
    tripCategory,
    purposeDetails,
    departureDate,
    departureHour: getHour(departureTime),
    expectedReturnDate,
    expectedReturnHour: getHour(expectedReturnTime),
  });

  const requestCode = makeRequestCode();

  const { data: insertedRequest, error: requestError } = await supabase
    .from("requests")
    .insert({
      request_code: requestCode,
      staff_profile_id: profile.id,
      unit_id: unitId || profile.unit_id || null,
      destination,
      purpose,
      passenger_count: passengerCount,
      departure_date: departureDate,
      departure_time: departureTime,
      expected_return_date: expectedReturnDate,
      expected_return_time: expectedReturnTime,
      trip_type: tripCategory || null,
      notes: notes || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (requestError || !insertedRequest) {
    return { error: requestError?.message || "Failed to create request." };
  }

  const { error: aiLogError } = await supabase.from("ai_logs").insert({
    request_id: insertedRequest.id,
    estimated_duration_minutes: insights.estimatedDurationMinutes,
    recommended_vehicle_category: insights.recommendedVehicleCategory,
    risk_flag: insights.riskLevel.toLowerCase(),
    reason: insights.note,
  });

  if (aiLogError) {
    return { error: aiLogError.message };
  }

  const approvers = await getProfileIdsByRole(["approver"]);

  await sendBulkNotifications(
    approvers.map((item) => ({
      profileId: item.id,
      title: "New Transport Request",
      message: `${profile.full_name} submitted a new transport request: ${requestCode}.`,
      type: "request_submitted",
      link: "/approver/requests/pending",
    }))
  );

  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/requests/my-requests");
  revalidatePath("/staff/requests/new");
  revalidatePath("/approver/dashboard");
  revalidatePath("/approver/requests/pending");

  return { success: "Transport request submitted successfully." };
}