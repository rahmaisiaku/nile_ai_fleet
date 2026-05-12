"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const vehicleTypeValues = ["assigned", "pool"] as const;
const vehicleCategoryValues = ["luxury", "non_luxury"] as const;
const vehicleStatusValues = [
  "available",
  "allocated",
  "in_trip",
  "maintenance",
  "inactive",
] as const;

const vehicleFormSchema = z.object({
  plate_no: z
    .string()
    .trim()
    .min(3, "Plate number must be at least 3 characters.")
    .max(30, "Plate number is too long.")
    .transform((value) => value.toUpperCase()),

  make: z
    .string()
    .trim()
    .max(50, "Make is too long.")
    .optional()
    .or(z.literal("")),

  model: z
    .string()
    .trim()
    .max(50, "Model is too long.")
    .optional()
    .or(z.literal("")),

  type: z.enum(vehicleTypeValues, {
    message: "Select a valid vehicle type.",
  }),

  category: z.enum(vehicleCategoryValues, {
    message: "Select a valid vehicle category.",
  }),

  status: z.enum(vehicleStatusValues, {
    message: "Select a valid vehicle status.",
  }),
});

const createVehicleSchema = vehicleFormSchema;

const updateVehicleSchema = vehicleFormSchema.extend({
  vehicle_id: z.string().uuid("Invalid vehicle id."),
});

export type VehicleFormState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    plate_no?: string[];
    make?: string[];
    model?: string[];
    type?: string[];
    category?: string[];
    status?: string[];
  };
};

export async function createVehicleAction(
  _prevState: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const supabase = createAdminClient();

  const parsed = createVehicleSchema.safeParse({
    plate_no: formData.get("plate_no"),
    make: formData.get("make"),
    model: formData.get("model"),
    type: formData.get("type"),
    category: formData.get("category"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { plate_no, make, model, type, category, status } = parsed.data;

  const normalizedMake = make?.trim() ? make.trim() : null;
  const normalizedModel = model?.trim() ? model.trim() : null;

  const { data: existingVehicle, error: existingVehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("plate_no", plate_no)
    .maybeSingle();

  if (existingVehicleError) {
    return { error: existingVehicleError.message };
  }

  if (existingVehicle) {
    return { error: "A vehicle with this plate number already exists." };
  }

  const { error } = await supabase.from("vehicles").insert({
    plate_no,
    make: normalizedMake,
    model: normalizedModel,
    type,
    category,
    status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/vehicles");

  return {
    success: "Vehicle created successfully.",
  };
}

export async function updateVehicleAction(
  _prevState: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const supabase = createAdminClient();

  const parsed = updateVehicleSchema.safeParse({
    vehicle_id: formData.get("vehicle_id"),
    plate_no: formData.get("plate_no"),
    make: formData.get("make"),
    model: formData.get("model"),
    type: formData.get("type"),
    category: formData.get("category"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { vehicle_id, plate_no, make, model, type, category, status } =
    parsed.data;

  const normalizedMake = make?.trim() ? make.trim() : null;
  const normalizedModel = model?.trim() ? model.trim() : null;

  const { data: existingVehicle, error: existingVehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("plate_no", plate_no)
    .neq("id", vehicle_id)
    .maybeSingle();

  if (existingVehicleError) {
    return { error: existingVehicleError.message };
  }

  if (existingVehicle) {
    return { error: "Another vehicle already uses this plate number." };
  }

  const { error } = await supabase
    .from("vehicles")
    .update({
      plate_no,
      make: normalizedMake,
      model: normalizedModel,
      type,
      category,
      status,
    })
    .eq("id", vehicle_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/vehicles/${vehicle_id}/edit`);

  return {
    success: "Vehicle updated successfully.",
  };
}