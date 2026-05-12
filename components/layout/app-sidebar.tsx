"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  PlusCircle,
  Route,
  Users,
  PersonStanding,
  X,
  CarFront,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { AppLogo } from "@/components/shared/app-logo";

type Role = "staff" | "approver" | "admin" | "driver";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type AppSidebarProps = {
  role: Role;
  mobileOpen?: boolean;
  onClose?: () => void;
  currentUser: {
    fullName: string;
    email: string;
    role: Role;
  };
};

const navByRole: Record<Role, SidebarItem[]> = {
  staff: [
    { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { label: "Request Vehicle", href: "/staff/requests/new", icon: PlusCircle },
    { label: "My Requests", href: "/staff/requests/my-requests", icon: ClipboardList },
  ],
  approver: [
    { label: "Dashboard", href: "/approver/dashboard", icon: LayoutDashboard },
    { label: "Pending Requests", href: "/approver/requests/pending", icon: ClipboardList },
    { label: "History", href: "/approver/requests/history", icon: FileBarChart2 },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Allocation Board", href: "/admin/allocation", icon: CarFront },
    { label: "Vehicles", href: "/admin/vehicles", icon: CarFront },
    { label: "Drivers", href: "/admin/drivers", icon: Users },
    { label: "Users", href: "/admin/users", icon: PersonStanding },
    { label: "Trips", href: "/admin/trips", icon: Route },
    { label: "Reports", href: "/admin/reports", icon: FileBarChart2 },
  ],
  driver: [
    { label: "Dashboard", href: "/driver/dashboard", icon: LayoutDashboard },
    { label: "Assigned Trips", href: "/driver/trips", icon: Route },
  ],
};

function formatRole(role: Role) {
  switch (role) {
    case "staff":
      return "Staff";
    case "approver":
      return "Approver";
    case "admin":
      return "Admin";
    case "driver":
      return "Driver";
    default:
      return "User";
  }
}

export function AppSidebar({
  role,
  mobileOpen = false,
  onClose,
  currentUser,
}: AppSidebarProps) {
  const pathname = usePathname();
  const items = navByRole[role];

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-white/95 shadow-xl backdrop-blur lg:shadow-none",
          "transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <AppLogo href={`/${role}/dashboard`} />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4 shrink-0" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-4 py-4">
          <div className="rounded-3xl bg-slate-100 p-4">
            <p className="truncate text-sm font-semibold text-slate-900">
              {currentUser.fullName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {currentUser.email || "No email available"}
            </p>
            <div className="mt-3 inline-flex max-w-full rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <span className="truncate">{formatRole(currentUser.role)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Navigation
          </p>

          <nav className="mt-4 space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>

                  <ChevronRight
                    className={clsx(
                      "h-4 w-4 shrink-0 transition",
                      isActive
                        ? "text-white/80"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}