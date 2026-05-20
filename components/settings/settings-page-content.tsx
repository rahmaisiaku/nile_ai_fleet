import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/forms/settings-form";

const DRIVER_PROFILE_COLUMN = "user_id";

export default async function SettingsPageContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, role, created_at, unit_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.log("SETTINGS PROFILE ERROR:", profileError);
    redirect("/login");
  }

  let unitName: string | null = null;

  if (profile.unit_id) {
    const { data: unit } = await supabase
      .from("units")
      .select("unit_name")
      .eq("id", profile.unit_id)
      .maybeSingle();

    unitName = unit?.unit_name ?? null;
  }

  let driverPhone: string | null = null;

  if (profile.role === "driver") {
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("phone")
      .eq(DRIVER_PROFILE_COLUMN, user.id)
      .maybeSingle();

    if (driverError) {
      console.log("SETTINGS DRIVER ERROR:", driverError);
    }

    driverPhone = driver?.phone ?? null;
  }

  const normalizedProfile = {
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role,
    created_at: profile.created_at,
    unit: {
      unit_name: unitName,
    },
  };

  return (
    <div className="mx-auto max-w-4xl">
      <SettingsForm profile={normalizedProfile} driverPhone={driverPhone} />
    </div>
  );
}