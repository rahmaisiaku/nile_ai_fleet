"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const userRoleValues = ["staff", "approver"] as const;

const userFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .toLowerCase(),
  role: z.enum(userRoleValues, {
    message: "Select a valid role.",
  }),
});

const createUserSchema = userFormSchema;

const updateUserSchema = userFormSchema.extend({
  profile_id: z.string().uuid("Invalid profile id."),
});

export type UserFormState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    full_name?: string[];
    email?: string[];
    role?: string[];
  };
};

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const supabase = createAdminClient();

  const parsed = createUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { full_name, email, role } = parsed.data;
  const defaultPassword = "users321";

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
        role,
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
    role,
    unit_id: null,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUserId);
    return { error: profileError.message };
  }

  revalidatePath("/admin/users");

  return {
    success: `User created successfully. Default password: ${defaultPassword}`,
  };
}

export async function updateUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const supabase = createAdminClient();

  const parsed = updateUserSchema.safeParse({
    profile_id: formData.get("profile_id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { profile_id, full_name, email, role } = parsed.data;

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
      role,
    })
    .eq("id", profile_id);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(
    profile_id,
    {
      email,
      user_metadata: {
        full_name,
        role,
      },
    }
  );

  if (authError) {
    return {
      error:
        "Profile updated, but auth email update failed. Please check the auth user manually.",
    };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${profile_id}/edit`);

  return {
    success: "User updated successfully.",
  };
}