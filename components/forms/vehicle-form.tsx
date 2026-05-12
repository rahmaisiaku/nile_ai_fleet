"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { VehicleFormState } from "@/app/actions/vehicles";

type VehicleFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: VehicleFormState,
    formData: FormData
  ) => Promise<VehicleFormState>;
  initialValues?: {
    vehicle_id?: string;
    plate_no?: string;
    make?: string | null;
    model?: string | null;
    type?: "assigned" | "pool";
    category?: "luxury" | "non_luxury";
    status?: "available" | "allocated" | "in_trip" | "maintenance" | "inactive";
  };
};

const initialState: VehicleFormState = {};

export function VehicleForm({
  mode,
  action,
  initialValues,
}: VehicleFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/admin/vehicles");
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" ? (
        <input
          type="hidden"
          name="vehicle_id"
          value={initialValues?.vehicle_id ?? ""}
        />
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="plate_no"
            className="text-sm font-medium text-slate-700"
          >
            Plate number
          </label>
          <input
            id="plate_no"
            name="plate_no"
            type="text"
            defaultValue={initialValues?.plate_no ?? ""}
            placeholder="ABC-123XY"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            required
          />
          {state.fieldErrors?.plate_no?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.plate_no[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="make" className="text-sm font-medium text-slate-700">
            Make
          </label>
          <input
            id="make"
            name="make"
            type="text"
            defaultValue={initialValues?.make ?? ""}
            placeholder="Toyota"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          {state.fieldErrors?.make?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.make[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-slate-700">
            Model
          </label>
          <input
            id="model"
            name="model"
            type="text"
            defaultValue={initialValues?.model ?? ""}
            placeholder="Corolla"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          {state.fieldErrors?.model?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.model[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Vehicle type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initialValues?.type ?? "pool"}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="pool">Pool Vehicle</option>
            <option value="assigned">Assigned Vehicle</option>
          </select>
          {state.fieldErrors?.type?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.type[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="category"
            className="text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initialValues?.category ?? "non_luxury"}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="non_luxury">Non-Luxury</option>
            <option value="luxury">Luxury</option>
          </select>
          {state.fieldErrors?.category?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.category[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="status"
            className="text-sm font-medium text-slate-700"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initialValues?.status ?? "available"}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="available">Available</option>
            <option value="allocated">Allocated</option>
            <option value="in_trip">In Trip</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
          {state.fieldErrors?.status?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.status[0]}
            </p>
          ) : null}
        </div>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/vehicles")}
          className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Vehicle"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}