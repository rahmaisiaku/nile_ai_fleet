"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DriverFormState } from "@/app/actions/drivers";

type DriverFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: DriverFormState,
    formData: FormData
  ) => Promise<DriverFormState>;
  initialValues?: {
    driver_id?: string;
    profile_id?: string;
    full_name?: string;
    email?: string;
    phone?: string | null;
    is_available?: boolean;
  };
};

const initialState: DriverFormState = {};

export function DriverForm({
  mode,
  action,
  initialValues,
}: DriverFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/admin/drivers");
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" ? (
        <>
          <input
            type="hidden"
            name="driver_id"
            value={initialValues?.driver_id ?? ""}
          />
          <input
            type="hidden"
            name="profile_id"
            value={initialValues?.profile_id ?? ""}
          />
        </>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="full_name"
            className="text-sm font-medium text-slate-700"
          >
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={initialValues?.full_name ?? ""}
            placeholder="Ade Johnson"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            required
          />
          {state.fieldErrors?.full_name?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.full_name[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={initialValues?.email ?? ""}
            placeholder="adejohnson@nileuniversity.edu.ng"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            required
          />
          {state.fieldErrors?.email?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-slate-700"
          >
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            defaultValue={initialValues?.phone ?? ""}
            placeholder="+2348012345678"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          {state.fieldErrors?.phone?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.phone[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="is_available"
            className="text-sm font-medium text-slate-700"
          >
            Availability
          </label>
          <select
            id="is_available"
            name="is_available"
            defaultValue={
              initialValues?.is_available === false ? "false" : "true"
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {mode === "create" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Default password for new drivers:{" "}
          <span className="font-semibold">drivers321</span>
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/drivers")}
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
              ? "Create Driver"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}