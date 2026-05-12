import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StaffRequestWorkspace } from "@/components/forms/staff-request-workspace";
import { getUnits } from "@/lib/data/get-units";

export default async function NewRequestPage() {
  const units = await getUnits();

  return (
    <DashboardShell
      role="staff"
      title="Request Vehicle"
      subtitle="Submit a structured transport request for official duty."
    >
      <StaffRequestWorkspace units={units} />
    </DashboardShell>
  );
}