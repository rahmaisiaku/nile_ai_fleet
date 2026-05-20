import { DashboardShell } from "@/components/layout/dashboard-shell";
import SettingsPageContent from "@/components/settings/settings-page-content";

export default function AdminSettingsPage() {
  return (
    <DashboardShell
      role="admin"
      title="Settings"
      subtitle="Manage your profile and account security."
    >
      <SettingsPageContent />
    </DashboardShell>
  );
}