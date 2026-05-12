"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";

export type RequestFormState = {
  error?: string;
  success?: string;
};

function makeRequestCode() {
  return `REQ-${Date.now()}`;
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

  const destination = String(formData.get("destination") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const departureDate = String(formData.get("departureDate") ?? "").trim();
  const departureTime = String(formData.get("departureTime") ?? "").trim();
  const expectedReturnDate = String(formData.get("returnDate") ?? "").trim();
  const passengerCount = Number(formData.get("passengerCount") ?? 0);
  const tripType = String(formData.get("tripType") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const unitId = String(formData.get("unit") ?? "").trim();

  if (!destination || !purpose || !departureDate || !departureTime || passengerCount < 1) {
    return { error: "Please complete all required request fields." };
  }

  const { error } = await supabase.from("requests").insert({
    request_code: makeRequestCode(),
    staff_profile_id: profile.id,
    unit_id: unitId || profile.unit_id || null,
    destination,
    purpose,
    passenger_count: passengerCount,
    departure_date: departureDate,
    departure_time: departureTime,
    expected_return_date: expectedReturnDate || null,
    trip_type: tripType || null,
    notes: notes || null,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/requests/my-requests");
  revalidatePath("/staff/requests/new");

  return { success: "Transport request submitted successfully." };
}