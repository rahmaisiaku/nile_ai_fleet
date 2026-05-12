"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserFormState } from "@/app/actions/users";

type UserFormProps = {
  mode: "create" | "edit";
  action: (
    prevState: UserFormState,
    formData: FormData
  ) => Promise<UserFormState>;
  initialValues?: {
    profile_id?: string;
    full_name?: string;
    email?: string;
    role?: "staff" | "approver";
  };
};

const initialState: UserFormState = {};

export function UserForm({ mode, action, initialValues }: UserFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      router.push("/admin/users");
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" ? (
        <input
          type="hidden"
          name="profile_id"
          value={initialValues?.profile_id ?? ""}
        />
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
            placeholder="John Doe"
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
            placeholder="john@nileuniversity.edu.ng"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            required
          />
          {state.fieldErrors?.email?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="role"
            className="text-sm font-medium text-slate-700"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={initialValues?.role ?? "staff"}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="staff">Staff</option>
            <option value="approver">Approver</option>
          </select>
          {state.fieldErrors?.role?.[0] ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.role[0]}
            </p>
          ) : null}
        </div>
      </div>

      {mode === "create" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Default password for new users:{" "}
          <span className="font-semibold">users321</span>
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
          onClick={() => router.push("/admin/users")}
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
              ? "Create User"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}