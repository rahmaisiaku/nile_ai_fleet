import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  full_name: string;
  email: string;
  role: "staff" | "approver" | "admin" | "driver";
  unit_id: string | null;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, unit_id")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data as CurrentProfile;
}