import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Briefcase, Pencil, Plus, ShieldCheck } from "lucide-react";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "staff" | "approver" | string;
};

type UsersPageProps = {
  searchParams?: Promise<{
    role?: string;
  }>;
};

function getRoleMeta(role: string) {
  switch (role) {
    case "approver":
      return {
        label: "Approver",
        icon: ShieldCheck,
        avatarClassName: "bg-violet-100 text-violet-700",
        badgeClassName: "bg-violet-50 text-violet-700 border border-violet-200",
      };
    default:
      return {
        label: "Staff",
        icon: Briefcase,
        avatarClassName: "bg-blue-100 text-blue-700",
        badgeClassName: "bg-blue-50 text-blue-700 border border-blue-200",
      };
  }
}

function getFilterLink(targetRole: string, currentRole: string) {
  const active = currentRole === targetRole;

  return {
    href: targetRole === "all" ? "/admin/users" : `/admin/users?role=${targetRole}`,
    className: `inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-slate-900 text-white"
        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`,
  };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  noStore();

  const resolvedSearchParams = await searchParams;
  const roleFilter =
    resolvedSearchParams?.role === "staff" ||
    resolvedSearchParams?.role === "approver"
      ? resolvedSearchParams.role
      : "all";

  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["staff", "approver"])
    .order("created_at", { ascending: false });

  if (roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  const { data } = await query;
  const users = (data ?? []) as UserRow[];

  const allFilter = getFilterLink("all", roleFilter);
  const staffFilter = getFilterLink("staff", roleFilter);
  const approverFilter = getFilterLink("approver", roleFilter);

  return (
    <DashboardShell
      role="admin"
      title="Users"
      subtitle="Create and manage staff and approver accounts."
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Staff & Approvers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage non-driver user accounts in one place.
            </p>
          </div>

          <Link
            href="/admin/users/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-700 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New User
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link href={allFilter.href} className={allFilter.className}>
            All
          </Link>
          <Link href={staffFilter.href} className={staffFilter.className}>
            Staff
          </Link>
          <Link href={approverFilter.href} className={approverFilter.className}>
            Approvers
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-sm text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-sm">
              {users.length > 0 ? (
                users.map((user) => {
                  const roleMeta = getRoleMeta(user.role);
                  const RoleIcon = roleMeta.icon;

                  return (
                    <tr key={user.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${roleMeta.avatarClassName}`}
                          >
                            <RoleIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {user.full_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {roleMeta.label}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">{user.email}</td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${roleMeta.badgeClassName}`}
                        >
                          {roleMeta.label}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No users found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}