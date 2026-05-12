"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import { sendBulkNotifications } from "@/lib/notifications/send-notification";

export type AllocationFormState = {
  error?: string;
  success?: string;
};

const initialStateStatuses = ["approved"];

export async function allocateTransportRequest(
  prevState: AllocationFormState,
  formData: FormData
): Promise<AllocationFormState> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "You must be logged in to allocate requests." };
  }

  if (profile.role !== "admin") {
    return { error: "Only admins can allocate transport requests." };
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const driverId = String(formData.get("driverId") ?? "").trim();

  if (!requestId || !vehicleId || !driverId) {
    return { error: "Please select a request, vehicle, and driver." };
  }

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("id, request_code, destination, staff_profile_id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { error: "Request not found." };
  }

  if (!initialStateStatuses.includes(request.status)) {
    return { error: "Only approved requests can be allocated." };
  }

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, status")
    .eq("id", vehicleId)
    .single();

  if (vehicleError || !vehicle) {
    return { error: "Vehicle not found." };
  }

  if (vehicle.status !== "available") {
    return { error: "Selected vehicle is not available." };
  }

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, is_available, profile_id")
    .eq("id", driverId)
    .single();

  if (driverError || !driver) {
    return { error: "Driver not found." };
  }

  if (!driver.is_available) {
    return { error: "Selected driver is not available." };
  }

  const { data: allocation, error: allocationError } = await supabase
    .from("allocations")
    .insert({
      request_id: requestId,
      vehicle_id: vehicleId,
      driver_id: driverId,
      allocated_by_profile_id: profile.id,
    })
    .select("id")
    .single();

  if (allocationError || !allocation) {
    return { error: allocationError?.message || "Failed to create allocation." };
  }

  const { error: requestUpdateError } = await supabase
    .from("requests")
    .update({ status: "allocated" })
    .eq("id", requestId);

  if (requestUpdateError) {
    return { error: requestUpdateError.message };
  }

  const { error: vehicleUpdateError } = await supabase
    .from("vehicles")
    .update({ status: "allocated" })
    .eq("id", vehicleId);

  if (vehicleUpdateError) {
    return { error: vehicleUpdateError.message };
  }

  const { error: driverUpdateError } = await supabase
    .from("drivers")
    .update({ is_available: false })
    .eq("id", driverId);

  if (driverUpdateError) {
    return { error: driverUpdateError.message };
  }

  const { error: tripError } = await supabase.from("trips").insert({
    request_id: requestId,
    allocation_id: allocation.id,
  });

  if (tripError) {
    return { error: tripError.message };
  }

  await sendBulkNotifications([
    {
      profileId: request.staff_profile_id,
      title: "Vehicle Allocated",
      message: `Your request ${request.request_code} has been allocated for ${request.destination}.`,
      type: "request_allocated",
      link: `/staff/requests/${request.id}`,
    },
    ...(driver.profile_id
      ? [
          {
            profileId: driver.profile_id,
            title: "New Trip Assigned",
            message: `You have been assigned a trip for ${request.destination}.`,
            type: "trip_assigned",
            link: "/driver/trips",
          },
        ]
      : []),
  ]);

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/allocation");
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/trips");
  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/requests/my-requests");
  revalidatePath(`/staff/requests/${requestId}`);
  revalidatePath("/driver/dashboard");
  revalidatePath("/driver/trips");

  return { success: "Transport request allocated successfully." };
}