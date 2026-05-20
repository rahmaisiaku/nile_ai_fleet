import { DashboardShell } from "@/components/layout/dashboard-shell";
import SettingsPageContent from "@/components/settings/settings-page-content";

export default function StaffSettingsPage() {
  return (
    <DashboardShell
      role="staff"
      title="Settings"
      subtitle="Manage your profile and account security."
    >
      <SettingsPageContent />
    </DashboardShell>
  );
}