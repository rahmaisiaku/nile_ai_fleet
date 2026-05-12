"use client";

import { useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { TopbarNotification } from "@/lib/data/get-my-notifications";

type Role = "staff" | "approver" | "admin" | "driver";

type DashboardShellClientProps = {
  role: Role;
  title: string;
  subtitle?: string;
  children: ReactNode;
  currentUser: {
    fullName: string;
    email: string;
    role: Role;
  };
  notifications: {
    unreadCount: number;
    notifications: TopbarNotification[];
  };
};

export function DashboardShellClient({
  role,
  title,
  subtitle,
  children,
  currentUser,
  notifications,
}: DashboardShellClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar
        role={role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        currentUser={currentUser}
      />

      <div className="min-h-screen lg:pl-72">
        <Topbar
          title={title}
          subtitle={subtitle}
          onOpenSidebar={() => setMobileOpen(true)}
          currentUser={currentUser}
          notifications={notifications}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}