import { DashboardShell } from "@/components/layout/dashboard-shell";
import SettingsPageContent from "@/components/settings/settings-page-content";

export default function ApproverSettingsPage() {
  return (
    <DashboardShell
      role="approver"
      title="Settings"
      subtitle="Manage your profile and account security."
    >
      <SettingsPageContent />
    </DashboardShell>
  );
}