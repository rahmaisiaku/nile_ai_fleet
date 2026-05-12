import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/get-current-profile";

export type TopbarNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export async function getMyNotifications() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      unreadCount: 0,
      notifications: [] as TopbarNotification[],
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, link, is_read, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !data) {
    return {
      unreadCount: 0,
      notifications: [] as TopbarNotification[],
    };
  }

  return {
    unreadCount: data.filter((item) => !item.is_read).length,
    notifications: data as TopbarNotification[],
  };
}