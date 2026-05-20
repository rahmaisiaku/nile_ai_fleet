"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  success?: string;
  error?: string;
};

const DRIVER_PROFILE_COLUMN = "user_id";
// If your drivers table uses profile_id instead, change to:
// const DRIVER_PROFILE_COLUMN = "profile_id";

function revalidateSettingsPages() {
  revalidatePath("/", "layout");
  revalidatePath("/staff/settings");
  revalidatePath("/admin/settings");
  revalidatePath("/approver/settings");
  revalidatePath("/driver/settings");
}

export async function updateProfileSettings(
  prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!fullName) {
    return { error: "Full name is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unable to verify authenticated user." };
  }

  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!existingProfile) {
    return {
      error:
        "No profile row was found for this authenticated user. The profile ID may not match the auth user ID.",
    };
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
    })
    .eq("id", user.id)
    .select("id, full_name")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updatedProfile) {
    return {
      error:
        "Profile was not updated. This may be caused by a missing Supabase RLS update policy.",
    };
  }

  revalidateSettingsPages();

  return {
    success: `Profile updated successfully to ${updatedProfile.full_name}.`,
  };
}

export async function updateDriverPhoneSettings(
  prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const phone = String(formData.get("phone") ?? "").trim();

  const phoneRegex = /^(\+?[0-9]{10,15})$/;

  if (!phone) {
    return { error: "Phone number is required." };
  }

  if (!phoneRegex.test(phone)) {
    return {
      error:
        "Enter a valid phone number. Use 10 to 15 digits, with optional + at the beginning.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unable to verify authenticated user." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (!profile) {
    return { error: "Profile not found." };
  }

  if (profile.role !== "driver") {
    return { error: "Only drivers can update driver contact information." };
  }

  const { data: updatedDriver, error: updateError } = await supabase
    .from("drivers")
    .update({ phone })
    .eq(DRIVER_PROFILE_COLUMN, user.id)
    .select("id, phone")
    .maybeSingle();

  if (updateError) {
    return { error: updateError.message };
  }

  if (!updatedDriver) {
    return {
      error:
        "Driver phone was not updated. Check whether drivers.user_id matches the authenticated user ID.",
    };
  }

  revalidateSettingsPages();

  return { success: "Driver phone number updated successfully." };
}

export async function updatePasswordSettings(
  prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const currentPassword = String(formData.get("current_password") ?? "").trim();
  const newPassword = String(formData.get("new_password") ?? "").trim();
  const confirmPassword = String(formData.get("confirm_password") ?? "").trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New password and confirm password do not match." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters long." };
  }

  if (currentPassword === newPassword) {
    return { error: "New password must be different from current password." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return { error: "Unable to verify authenticated user." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: "Password updated successfully." };
}