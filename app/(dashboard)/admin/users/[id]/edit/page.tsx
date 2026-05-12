import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { UserForm } from "@/components/forms/user-form";
import { updateUserAction } from "@/app/actions/users";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type UserQueryRow = {
  id: string;
  full_name: string;
  email: string;
  role: "staff" | "approver";
};

export default async function EditUserPage({ params }: PageProps) {
  noStore();

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .in("role", ["staff", "approver"])
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const user = data as UserQueryRow;

  return (
    <DashboardShell
      role="admin"
      title="Edit User"
      subtitle="Update user details and role."
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            User Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep staff and approver account information accurate.
          </p>
        </div>

        <UserForm
          mode="edit"
          action={updateUserAction}
          initialValues={{
            profile_id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
          }}
        />
      </div>
    </DashboardShell>
  );
}