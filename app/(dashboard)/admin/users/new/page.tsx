import { DashboardShell } from "@/components/layout/dashboard-shell";
import { UserForm } from "@/components/forms/user-form";
import { createUserAction } from "@/app/actions/users";

export default function NewUserPage() {
  return (
    <DashboardShell
      role="admin"
      title="New User"
      subtitle="Create a staff or approver account."
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            User Setup
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create an auth account and matching profile in one flow.
          </p>
        </div>

        <UserForm mode="create" action={createUserAction} />
      </div>
    </DashboardShell>
  );
}