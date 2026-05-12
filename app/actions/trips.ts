"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import {
  getProfileIdsByRole,
  sendBulkNotifications,
} from "@/lib/notifications/send-notification";

export type TripActionState = {
  error?: string;
  success?: string;
};

function isLateReturn(
  actualReturnAt: string,
  expectedReturnDate: string | null,
  expectedReturnTime: string | null
): boolean {
  if (!expectedReturnDate || !expectedReturnTime) return false;

  const expected = new Date(`${expectedReturnDate}T${expectedReturnTime}`);
  const actual = new Date(actualReturnAt);

  if (Number.isNaN(expected.getTime()) || Number.isNaN(actual.getTime())) {
    return false;
  }

  return actual.getTime() > expected.getTime();
}

export async function startTripAction(
  prevState: TripActionState,
  formData: FormData
): Promise<TripActionState> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "You must be logged in to start a trip." };
  }

  if (profile.role !== "driver") {
    return { error: "Only drivers can start trips." };
  }

  const tripId = String(formData.get("tripId") ?? "").trim();

  if (!tripId) {
    return { error: "Missing trip information." };
  }

  const { data: driverRow, error: driverError } = await supabase
    .from("drivers")
    .select("id")
    .eq("profile_id", profile.id)
    .single();

  if (driverError || !driverRow) {
    return { error: "Driver record not found." };
  }

  const { data: tripRow, error: tripError } = await supabase
    .from("trips")
    .select(`
      id,
      request_id,
      allocation_id,
      actual_departure_at,
      allocation:allocations(
        id,
        driver_id,
        vehicle_id
      )
    `)
    .eq("id", tripId)
    .single();

  if (tripError || !tripRow) {
    return { error: "Trip not found." };
  }

  const allocation = Array.isArray(tripRow.allocation)
    ? tripRow.allocation[0]
    : tripRow.allocation;

  if (!allocation || allocation.driver_id !== driverRow.id) {
    return { error: "This trip is not assigned to you." };
  }

  if (tripRow.actual_departure_at) {
    return { error: "This trip has already started." };
  }

  const startedAt = new Date().toISOString();

  const { error: tripUpdateError } = await supabase
    .from("trips")
    .update({
      actual_departure_at: startedAt,
    })
    .eq("id", tripId);

  if (tripUpdateError) {
    return { error: tripUpdateError.message };
  }

  const { data: updatedRequest, error: requestUpdateError } = await supabase
    .from("requests")
    .update({ status: "in_trip" })
    .eq("id", tripRow.request_id)
    .select("id, status")
    .maybeSingle();

  if (requestUpdateError) {
    return { error: requestUpdateError.message };
  }

  if (!updatedRequest) {
    return {
      error:
        "Trip started, but the linked request status could not be updated.",
    };
  }

  const { error: vehicleUpdateError } = await supabase
    .from("vehicles")
    .update({ status: "in_trip" })
    .eq("id", allocation.vehicle_id);

  if (vehicleUpdateError) {
    return { error: vehicleUpdateError.message };
  }

  const { data: requestDetails } = await supabase
    .from("requests")
    .select("id, request_code, destination, staff_profile_id")
    .eq("id", tripRow.request_id)
    .single();

  const admins = await getProfileIdsByRole(["admin"]);

  if (requestDetails) {
    await sendBulkNotifications([
      {
        profileId: requestDetails.staff_profile_id,
        title: "Trip Started",
        message: `Your allocated trip for ${requestDetails.destination} has started.`,
        type: "trip_started",
        link: `/staff/requests/${requestDetails.id}`,
      },
      ...admins.map((item) => ({
        profileId: item.id,
        title: "Trip In Progress",
        message: `Trip ${requestDetails.request_code} is now in progress.`,
        type: "trip_in_progress",
        link: "/admin/trips?status=in_trip",
      })),
    ]);
  }

  revalidatePath("/driver/dashboard");
  revalidatePath("/driver/trips");
  revalidatePath(`/driver/trips/${tripId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/trips");
  revalidatePath("/staff/dashboard");

  return { success: "Trip started successfully." };
}

export async function endTripAction(
  prevState: TripActionState,
  formData: FormData
): Promise<TripActionState> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "You must be logged in to end a trip." };
  }

  if (profile.role !== "driver") {
    return { error: "Only drivers can end trips." };
  }

  const tripId = String(formData.get("tripId") ?? "").trim();
  const driverNote = String(formData.get("driverNote") ?? "").trim();

  if (!tripId) {
    return { error: "Missing trip information." };
  }

  const { data: driverRow, error: driverError } = await supabase
    .from("drivers")
    .select("id")
    .eq("profile_id", profile.id)
    .single();

  if (driverError || !driverRow) {
    return { error: "Driver record not found." };
  }

  const { data: tripRow, error: tripError } = await supabase
    .from("trips")
    .select(`
      id,
      request_id,
      allocation_id,
      actual_departure_at,
      actual_return_at,
      allocation:allocations(
        id,
        driver_id,
        vehicle_id
      ),
      request:requests(
        expected_return_date,
        expected_return_time
      )
    `)
    .eq("id", tripId)
    .single();

  if (tripError || !tripRow) {
    return { error: "Trip not found." };
  }

  const allocation = Array.isArray(tripRow.allocation)
    ? tripRow.allocation[0]
    : tripRow.allocation;

  const request = Array.isArray(tripRow.request)
    ? tripRow.request[0]
    : tripRow.request;

  if (!allocation || allocation.driver_id !== driverRow.id) {
    return { error: "This trip is not assigned to you." };
  }

  if (!tripRow.actual_departure_at) {
    return { error: "You must start the trip before ending it." };
  }

  if (tripRow.actual_return_at) {
    return { error: "This trip has already been completed." };
  }

  const returnedAt = new Date().toISOString();
  const lateReturn = isLateReturn(
    returnedAt,
    request?.expected_return_date ?? null,
    request?.expected_return_time ?? null
  );

  const { error: tripUpdateError } = await supabase
    .from("trips")
    .update({
      actual_return_at: returnedAt,
      driver_note: driverNote || null,
      late_return: lateReturn,
    })
    .eq("id", tripId);

  if (tripUpdateError) {
    return { error: tripUpdateError.message };
  }

  const { data: updatedRequest, error: requestUpdateError } = await supabase
    .from("requests")
    .update({ status: "completed" })
    .eq("id", tripRow.request_id)
    .select("id, status")
    .maybeSingle();

  if (requestUpdateError) {
    return { error: requestUpdateError.message };
  }

  if (!updatedRequest) {
    return {
      error:
        "Trip was marked completed, but the linked request status could not be updated.",
    };
  }

  const { error: vehicleUpdateError } = await supabase
    .from("vehicles")
    .update({ status: "available" })
    .eq("id", allocation.vehicle_id);

  if (vehicleUpdateError) {
    return { error: vehicleUpdateError.message };
  }

  const { error: driverUpdateError } = await supabase
    .from("drivers")
    .update({ is_available: true })
    .eq("id", driverRow.id);

  if (driverUpdateError) {
    return { error: driverUpdateError.message };
  }

  const { data: requestDetails } = await supabase
    .from("requests")
    .select("id, request_code, destination, staff_profile_id")
    .eq("id", tripRow.request_id)
    .single();

  const admins = await getProfileIdsByRole(["admin"]);

  if (requestDetails) {
    await sendBulkNotifications([
      {
        profileId: requestDetails.staff_profile_id,
        title: lateReturn ? "Trip Completed With Late Return" : "Trip Completed",
        message: lateReturn
          ? `Your trip for ${requestDetails.destination} has been completed and flagged as late.`
          : `Your trip for ${requestDetails.destination} has been completed.`,
        type: lateReturn ? "trip_completed_late" : "trip_completed",
        link: `/staff/requests/${requestDetails.id}`,
      },
      ...admins.map((item) => ({
        profileId: item.id,
        title: lateReturn ? "Late Return Flagged" : "Trip Completed",
        message: lateReturn
          ? `Trip ${requestDetails.request_code} completed with a late return flag.`
          : `Trip ${requestDetails.request_code} has been completed.`,
        type: lateReturn ? "late_return_flagged" : "trip_completed",
        link: lateReturn ? "/admin/trips?late=yes" : "/admin/trips?status=completed",
      })),
    ]);
  }

  revalidatePath("/driver/dashboard");
  revalidatePath("/driver/trips");
  revalidatePath(`/driver/trips/${tripId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/trips");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/vehicles");
  revalidatePath("/staff/dashboard");

  return {
    success: lateReturn
      ? "Trip ended successfully. Late return was flagged."
      : "Trip ended successfully.",
  };
}