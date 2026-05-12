import Link from "next/link";
import {
  CarFront,
  ClipboardList,
  Route,
  TriangleAlert,
  Plus,
  UserPlus,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { createClient } from "@/lib/supabase/server";

type QueueRow = {
  id: string;
  request_code: string;
  destination: string;
};

async function getAdminDashboardData() {
  noStore();

  const supabase = await createClient();

  const { data: approvedRequests } = await supabase
    .from("requests")
    .select("id")
    .eq("status", "approved");

  const { data: availableVehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("status", "available");

  const { data: activeTrips } = await supabase
    .from("requests")
    .select("id")
    .in("status", ["allocated", "in_trip"]);

  const { data: lateTrips } = await supabase
    .from("trips")
    .select("id")
    .eq("late_return", true);

  const { data: queueData } = await supabase
    .from("requests")
    .select("id, request_code, destination")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    pendingAllocation: approvedRequests?.length ?? 0,
    availableVehicles: availableVehicles?.length ?? 0,
    activeTrips: activeTrips?.length ?? 0,
    lateFlags: lateTrips?.length ?? 0,
    queue: (queueData ?? []) as QueueRow[],
  };
}

const quickActions = [
  {
    label: "Add Vehicle",
    href: "/admin/vehicles/new",
    icon: CarFront,
    description: "Register a new vehicle",
    iconClass: "bg-blue-50 text-blue-700",
  },
  {
    label: "Add Driver",
    href: "/admin/drivers/new",
    icon: Truck,
    description: "Create a driver profile",
    iconClass: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Add Staff",
    href: "/admin/staff/new",
    icon: UserPlus,
    description: "Create a staff account",
    iconClass: "bg-violet-50 text-violet-700",
  },
  {
    label: "Add Approver",
    href: "/admin/approvers/new",
    icon: ShieldCheck,
    description: "Create an approver account",
    iconClass: "bg-amber-50 text-amber-700",
  },
];

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <DashboardShell
      role="admin"
      title="Admin Dashboard"
      subtitle="Manage allocations, vehicles, drivers, and active transport operations."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/admin/allocation?status=approved"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              label="Pending Allocation"
              value={String(data.pendingAllocation)}
              helper="Open requests awaiting assignment"
              icon={<ClipboardList className="h-5 w-5" />}
            />
          </Link>

          <Link
            href="/admin/vehicles?status=available"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              label="Available Vehicles"
              value={String(data.availableVehicles)}
              helper="Open available vehicles"
              icon={<CarFront className="h-5 w-5" />}
            />
          </Link>

          <Link
            href="/admin/trips?status=active"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              label="Active Trips"
              value={String(data.activeTrips)}
              helper="View allocated and in-trip movements"
              icon={<Route className="h-5 w-5" />}
            />
          </Link>

          <Link
            href="/admin/trips?late=yes"
            className="block transition hover:-translate-y-0.5"
          >
            <StatCard
              label="Late Return Flags"
              value={String(data.lateFlags)}
              helper="View trips flagged as late"
              icon={<TriangleAlert className="h-5 w-5" />}
            />
          </Link>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Allocation Queue Overview
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  A quick operational view of requests waiting for allocation.
                </p>
              </div>

              <Link
                href="/admin/allocation?status=approved"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                View All
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {data.queue.length > 0 ? (
                data.queue.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/allocation?requestId=${item.id}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.request_code}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-700">
                          Destination: {item.destination}
                        </p>
                      </div>

                      <StatusBadge status="Approved" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    No approved requests waiting for allocation right now.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                  Quick Actions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fast access to common admin setup tasks.
                </p>
              </div>

              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Plus className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${action.iconClass}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {action.label}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}