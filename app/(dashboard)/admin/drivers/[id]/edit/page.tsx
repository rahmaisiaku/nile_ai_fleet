import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { DriverForm } from "@/components/forms/driver-form";
import { updateDriverAction } from "@/app/actions/drivers";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DriverQueryRow = {
  id: string;
  profile_id: string | null;
  phone: string | null;
  is_available: boolean;
  profile:
    | {
        full_name: string;
        email: string;
      }
    | {
        full_name: string;
        email: string;
      }[]
    | null;
};

function getProfileInfo(profile: DriverQueryRow["profile"]) {
  const resolved = Array.isArray(profile) ? profile[0] : profile;

  return {
    full_name: resolved?.full_name ?? "",
    email: resolved?.email ?? "",
  };
}

export default async function EditDriverPage({ params }: PageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("drivers")
    .select(`
      id,
      profile_id,
      phone,
      is_available,
      profile:profiles!drivers_profile_id_fkey(full_name, email)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !data || !data.profile_id) {
    notFound();
  }

  const driver = data as DriverQueryRow;
  const profile = getProfileInfo(driver.profile);

  return (
    <DashboardShell
      role="admin"
      title="Edit Driver"
      subtitle="Update the driver profile and availability."
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Driver Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep contact details and availability accurate.
          </p>
        </div>

        <DriverForm
          mode="edit"
          action={updateDriverAction}
          initialValues={{
            driver_id: driver.id,
            profile_id: driver.profile_id as string,
            full_name: profile.full_name,
            email: profile.email,
            phone: driver.phone,
            is_available: driver.is_available,
          }}
        />
      </div>
    </DashboardShell>
  );
}