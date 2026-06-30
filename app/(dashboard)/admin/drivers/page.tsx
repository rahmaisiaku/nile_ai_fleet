import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

type DriverProfileRelation =
  | {
      full_name: string;
      email: string;
    }
  | {
      full_name: string;
      email: string;
    }[]
  | null;

type DriverRow = {
  id: string;
  phone: string | null;
  is_available: boolean;
  profile: DriverProfileRelation;
};

function getDriverProfileInfo(profile: DriverProfileRelation) {
  const resolved = Array.isArray(profile) ? profile[0] : profile;

  return {
    fullName: resolved?.full_name ?? "Unnamed Driver",
    email: resolved?.email ?? "No email",
  };
}

function DriverStatusBadge({ isAvailable }: { isAvailable: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        isAvailable
          ? "bg-emerald-50 text-emerald-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {isAvailable ? "Available" : "Unavailable"}
    </span>
  );
}

export default async function DriversPage() {
  noStore();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("drivers")
    .select(
      `
      id,
      phone,
      is_available,
      profile:profiles!drivers_profile_id_fkey(full_name, email)
    `
    )
    .order("created_at", { ascending: false });

  console.log({ driversError: error });

  const drivers = (data ?? []) as unknown as DriverRow[];

  return (
    <DashboardShell
      role="admin"
      title="Drivers"
      subtitle="Track driver availability and assign drivers to active trips."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Driver Directory
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Operational overview of available and engaged drivers.
            </p>
          </div>

          <Link
            href="/admin/drivers/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-700 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Driver
          </Link>
        </div>

        {/* Mobile card view */}
        <div className="mt-6 space-y-3 md:hidden">
          {drivers.length > 0 ? (
            drivers.map((driver) => {
              const profile = getDriverProfileInfo(driver.profile);

              return (
                <div
                  key={driver.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Driver
                      </p>
                      <h3 className="mt-1 truncate text-base font-semibold text-slate-950">
                        {profile.fullName}
                      </h3>
                    </div>

                    <DriverStatusBadge isAvailable={driver.is_available} />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 break-all font-medium text-slate-700">
                        {profile.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Phone
                      </p>
                      <p className="mt-1 text-slate-700">
                        {driver.phone ?? "No phone"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/admin/drivers/${driver.id}/edit`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Driver
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              No drivers found.
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left">
              <thead className="bg-slate-50">
                <tr className="text-sm text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {drivers.length > 0 ? (
                  drivers.map((driver) => {
                    const profile = getDriverProfileInfo(driver.profile);

                    return (
                      <tr
                        key={driver.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4 text-slate-700">
                          {profile.fullName}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {profile.email}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {driver.phone ?? "No phone"}
                        </td>

                        <td className="px-4 py-4">
                          <DriverStatusBadge
                            isAvailable={driver.is_available}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/drivers/${driver.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}