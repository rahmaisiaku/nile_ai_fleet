"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import {
  getProfileIdsByRole,
  sendBulkNotifications,
} from "@/lib/notifications/send-notification";

export type ApprovalFormState = {
  error?: string;
  success?: string;
};

export async function reviewTransportRequest(
  prevState: ApprovalFormState,
  formData: FormData
): Promise<ApprovalFormState> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "You must be logged in to review requests." };
  }

  if (profile.role !== "approver" && profile.role !== "admin") {
    return { error: "You are not permitted to review transport requests." };
  }

  const requestId = String(formData.get("requestId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const comment = String(formData.get("comment") ?? "").trim();

  if (!requestId || !decision) {
    return { error: "Missing approval details." };
  }

  if (!["approved", "rejected"].includes(decision)) {
    return { error: "Invalid review decision." };
  }

  const { data: request, error: requestError } = await supabase
    .from("requests")
    .select("id, request_code, destination, staff_profile_id, status")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { error: "Request not found." };
  }

  if (request.status !== "pending") {
    return { error: "Only pending requests can be reviewed." };
  }

  const nextStatus = decision === "approved" ? "approved" : "rejected";

  const { error: approvalError } = await supabase.from("approvals").upsert(
    {
      request_id: requestId,
      approver_profile_id: profile.id,
      decision,
      comment: comment || null,
    },
    {
      onConflict: "request_id",
    }
  );

  if (approvalError) {
    return { error: approvalError.message };
  }

  const { error: requestUpdateError } = await supabase
    .from("requests")
    .update({ status: nextStatus })
    .eq("id", requestId);

  if (requestUpdateError) {
    return { error: requestUpdateError.message };
  }

  if (decision === "approved") {
    const admins = await getProfileIdsByRole(["admin"]);

    await sendBulkNotifications([
      {
        profileId: request.staff_profile_id,
        title: "Request Approved",
        message: `Your request ${request.request_code} has been approved and is awaiting allocation.`,
        type: "request_approved",
        link: `/staff/requests/${request.id}`,
      },
      ...admins.map((item) => ({
        profileId: item.id,
        title: "Approved Request Ready for Allocation",
        message: `Request ${request.request_code} is approved and ready for allocation.`,
        type: "request_ready_for_allocation",
        link: "/admin/allocation?status=approved",
      })),
    ]);
  } else {
    await sendBulkNotifications([
      {
        profileId: request.staff_profile_id,
        title: "Request Rejected",
        message: `Your request ${request.request_code} was rejected.`,
        type: "request_rejected",
        link: `/staff/requests/${request.id}`,
      },
    ]);
  }

  revalidatePath("/approver/dashboard");
  revalidatePath("/approver/requests/pending");
  revalidatePath("/approver/requests/history");
  revalidatePath(`/approver/requests/${requestId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/requests/my-requests");

  return {
    success:
      decision === "approved"
        ? "Request approved successfully."
        : "Request rejected successfully.",
  };
}