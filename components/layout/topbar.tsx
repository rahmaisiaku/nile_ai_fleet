"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/app/actions/notifications";
import type { TopbarNotification } from "@/lib/data/get-my-notifications";

type Role = "staff" | "approver" | "admin" | "driver";

type TopbarProps = {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
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

function getInitials(fullName: string) {
  return (
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function formatRelativeDate(value: string) {
  return new Date(value).toLocaleString();
}

export function Topbar({
  title,
  subtitle,
  onOpenSidebar,
  currentUser,
  notifications,
}: TopbarProps) {
  const router = useRouter();
  const [openNotifications, setOpenNotifications] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsAsRead();
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex min-h-[84px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5 shrink-0" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 lg:flex">
            <Search className="h-4 w-4 shrink-0" />
            <span>Workspace</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenNotifications((prev) => !prev)}
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 shrink-0" />
              {notifications.unreadCount > 0 ? (
                <span className="absolute right-2 top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                  {notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}
                </span>
              ) : null}
            </button>

            {openNotifications ? (
              <div className="absolute right-0 top-14 z-50 w-[360px] rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Notifications
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Recent activity across your workflow
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-blue-700 transition hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
                  {notifications.notifications.length > 0 ? (
                    notifications.notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3 ${
                          item.is_read
                            ? "border-slate-200 bg-white"
                            : "border-blue-100 bg-blue-50/40"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {item.message}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatRelativeDate(item.created_at)}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          {!item.is_read ? (
                            <form action={markNotificationAsRead}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={item.id}
                              />
                              <button
                                type="submit"
                                className="text-xs font-medium text-blue-700 transition hover:text-blue-800"
                              >
                                Mark as read
                              </button>
                            </form>
                          ) : null}

                          {item.link ? (
                            <Link
                              href={item.link}
                              className="text-xs font-medium text-slate-700 transition hover:text-slate-900"
                            >
                              Open
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {getInitials(currentUser.fullName)}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-slate-900">
                {currentUser.fullName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {formatRole(currentUser.role)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}