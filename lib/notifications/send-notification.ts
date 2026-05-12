import { createClient } from "@/lib/supabase/server";

type NotificationPayload = {
  profileId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
};

export async function sendNotification({
  profileId,
  title,
  message,
  type,
  link,
}: NotificationPayload) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    profile_id: profileId,
    title,
    message,
    type,
    link: link || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendBulkNotifications(
  notifications: NotificationPayload[]
) {
  if (!notifications.length) return;

  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert(
    notifications.map((item) => ({
      profile_id: item.profileId,
      title: item.title,
      message: item.message,
      type: item.type,
      link: item.link || null,
    }))
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getProfileIdsByRole(
  roles: Array<"staff" | "approver" | "admin" | "driver">
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role")
    .in("role", roles);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}