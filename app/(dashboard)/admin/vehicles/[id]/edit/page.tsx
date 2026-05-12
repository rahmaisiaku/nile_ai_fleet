import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { updateVehicleAction } from "@/app/actions/vehicles";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type VehicleQueryRow = {
  id: string;
  plate_no: string;
  make: string | null;
  model: string | null;
  type: "assigned" | "pool";
  category: "luxury" | "non_luxury";
  status: "available" | "allocated" | "in_trip" | "maintenance" | "inactive";
};

export default async function EditVehiclePage({ params }: PageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, plate_no, make, model, type, category, status")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const vehicle = data as VehicleQueryRow;

  return (
    <DashboardShell
      role="admin"
      title="Edit Vehicle"
      subtitle="Update vehicle details and operational status."
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Vehicle Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep fleet information accurate and up to date.
          </p>
        </div>

        <VehicleForm
          mode="edit"
          action={updateVehicleAction}
          initialValues={{
            vehicle_id: vehicle.id,
            plate_no: vehicle.plate_no,
            make: vehicle.make,
            model: vehicle.model,
            type: vehicle.type,
            category: vehicle.category,
            status: vehicle.status,
          }}
        />
      </div>
    </DashboardShell>
  );
}