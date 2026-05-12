"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";

export async function markNotificationAsRead(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) return;

  const notificationId = String(formData.get("notificationId") ?? "").trim();
  if (!notificationId) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("profile_id", profile.id);

  revalidatePath(`/${profile.role}/dashboard`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", profile.id)
    .eq("is_read", false);

  revalidatePath(`/${profile.role}/dashboard`);
}