import { type ReactNode } from "react";
import { getCurrentProfile } from "@/lib/data/get-current-profile";
import { getMyNotifications } from "@/lib/data/get-my-notifications";
import { DashboardShellClient } from "@/components/layout/dashboard-shell-client";

type Role = "staff" | "approver" | "admin" | "driver";

type DashboardShellProps = {
  role: Role;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export async function DashboardShell({
  role,
  title,
  subtitle,
  children,
}: DashboardShellProps) {
  const profile = await getCurrentProfile();
  const notificationsData = await getMyNotifications();

  return (
    <DashboardShellClient
      role={role}
      title={title}
      subtitle={subtitle}
      currentUser={{
        fullName: profile?.full_name ?? "User",
        email: profile?.email ?? "",
        role: profile?.role ?? role,
      }}
      notifications={notificationsData}
    >
      {children}
    </DashboardShellClient>
  );
}