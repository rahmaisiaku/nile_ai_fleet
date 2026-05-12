"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const driverFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  is_available: z.enum(["true", "false"]),
});

const createDriverSchema = driverFormSchema;

const updateDriverSchema = driverFormSchema.extend({
  driver_id: z.string().uuid("Invalid driver id."),
  profile_id: z.string().uuid("Invalid profile id."),
});

export type DriverFormState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    full_name?: string[];
    email?: string[];
    phone?: string[];
    is_available?: string[];
  };
};

export async function createDriverAction(
  _prevState: DriverFormState,
  formData: FormData
): Promise<DriverFormState> {
  const supabase = createAdminClient();

  const parsed = createDriverSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    is_available: formData.get("is_available"),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { full_name, email, phone, is_available } = parsed.data;
  const normalizedPhone = phone?.trim() ? phone.trim() : null;
  const available = is_available === "true";
  const defaultPassword = "drivers321";

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileError) {
    return { error: existingProfileError.message };
  }

  if (existingProfile) {
    return { error: "A profile with this email already exists." };
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: "driver",
      },
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Failed to create auth user." };
  }

  const authUserId = authData.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authUserId,
    full_name,
    email,
    role: "driver",
    unit_id: null,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUserId);
    return { error: profileError.message };
  }

  const { error: driverError } = await supabase.from("drivers").insert({
    profile_id: authUserId,
    phone: normalizedPhone,
    is_available: available,
  });

  if (driverError) {
    await supabase.from("profiles").delete().eq("id", authUserId);
    await supabase.auth.admin.deleteUser(authUserId);
    return { error: driverError.message };
  }

  revalidatePath("/dashboard/admin/drivers");

  return {
    success: `Driver created successfully. Default password: ${defaultPassword}`,
  };
}

export async function updateDriverAction(
  _prevState: DriverFormState,
  formData: FormData
): Promise<DriverFormState> {
  const supabase = createAdminClient();

  const parsed = updateDriverSchema.safeParse({
    driver_id: formData.get("driver_id"),
    profile_id: formData.get("profile_id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    is_available: formData.get("is_available"),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const {
    driver_id,
    profile_id,
    full_name,
    email,
    phone,
    is_available,
  } = parsed.data;

  const normalizedPhone = phone?.trim() ? phone.trim() : null;
  const available = is_available === "true";

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .neq("id", profile_id)
    .maybeSingle();

  if (existingProfileError) {
    return { error: existingProfileError.message };
  }

  if (existingProfile) {
    return { error: "Another user already uses this email address." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name,
      email,
    })
    .eq("id", profile_id);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: driverError } = await supabase
    .from("drivers")
    .update({
      phone: normalizedPhone,
      is_available: available,
    })
    .eq("id", driver_id);

  if (driverError) {
    return { error: driverError.message };
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(
    profile_id,
    {
      email,
      user_metadata: {
        full_name,
        role: "driver",
      },
    }
  );

  if (authError) {
    return {
      error:
        "Driver record updated, but auth email update failed. Please check the auth user manually.",
    };
  }

  revalidatePath("/dashboard/admin/drivers");
  revalidatePath(`/dashboard/admin/drivers/${driver_id}/edit`);

  return {
    success: "Driver updated successfully.",
  };
}