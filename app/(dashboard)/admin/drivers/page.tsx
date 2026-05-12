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

  const drivers = (data ?? []) as DriverRow[];

  return (
    <DashboardShell
      role="admin"
      title="Drivers"
      subtitle="Track driver availability and assign drivers to active trips."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Driver Directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Operational overview of available and engaged drivers.
            </p>
          </div>

          <Link
            href="/admin/drivers/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-700 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Driver
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left">
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
                    <tr key={driver.id} className="transition hover:bg-slate-50/70">
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
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            driver.is_available
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {driver.is_available ? "Available" : "Unavailable"}
                        </span>
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
    </DashboardShell>
  );
}