"use client";

import { useActionState } from "react";
import {
  updateDriverPhoneSettings,
  updatePasswordSettings,
  updateProfileSettings,
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/shared/loading-spinner";

type SettingsFormProps = {
  profile: {
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    unit?: {
      unit_name: string | null;
    } | null;
  };
  driverPhone?: string | null;
};

function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    staff: "Staff",
    approver: "Review Officer",
    admin: "Administrator",
    driver: "Driver",
  };

  return roleMap[role] ?? role;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(date));
}

export default function SettingsForm({
  profile,
  driverPhone,
}: SettingsFormProps) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileSettings,
    {}
  );

  const [phoneState, phoneAction, phonePending] = useActionState(
    updateDriverPhoneSettings,
    {}
  );

  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePasswordSettings,
    {}
  );

  const isDriver = profile.role === "driver";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your profile information and account security.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Profile Information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update your personal display name.
          </p>
        </div>

        <form action={profileAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile.full_name}
              placeholder="Enter your full name"
              required
              className="h-11"
            />
          </div>

          {profileState.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {profileState.error}
            </p>
          )}

          {profileState.success && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {profileState.success}
            </p>
          )}

          <Button 
          variant="default"
          type="submit" 
          disabled={profilePending}
          >
            {profilePending ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Saving...
              </span>
            ) : (
              "Save Profile"
            )}
          </Button>
        </form>
      </section>

      {isDriver && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Driver Contact Information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update your phone number for trip communication.
            </p>
          </div>

          <form action={phoneAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={driverPhone ?? ""}
                placeholder="Example: +2348012345678"
                className="h-11"
              />
            </div>

            {phoneState.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {phoneState.error}
              </p>
            )}

            {phoneState.success && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {phoneState.success}
              </p>
            )}

            <Button type="submit" disabled={phonePending}>
              {phonePending ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Saving...
                </span>
              ) : (
                "Save Contact"
              )}
            </Button>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Security Settings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Update your password securely.
          </p>
        </div>

        <form action={passwordAction} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              name="current_password"
              type="password"
              placeholder="Enter current password"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="Enter new password"
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Confirm new password"
              required
              className="h-11"
            />
          </div>

          <div className="md:col-span-2">
            {passwordState.error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {passwordState.error}
              </p>
            )}

            {passwordState.success && (
              <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {passwordState.success}
              </p>
            )}

            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner />
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Account Summary
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            These details are managed by the system administrator.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </p>
            <p className="mt-1 break-all font-medium text-slate-900">
              {profile.email}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Role
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {formatRole(profile.role)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Unit
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {profile.unit?.unit_name ?? "Not assigned"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Account Created
            </p>
            <p className="mt-1 font-medium text-slate-900">
              {formatDate(profile.created_at)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}