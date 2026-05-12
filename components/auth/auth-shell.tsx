import { ShieldCheck } from "lucide-react";
import { ReactNode } from "react";
import { AppLogo } from "@/components/shared/app-logo";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  description: string;
};

export function AuthShell({
  children,
  title,
  description,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden border-r border-slate-200 bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-10">
          <AppLogo dark />

          <div className="mx-auto w-full max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-blue-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure University Access
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
              {title}
            </h1>

            <p className="mt-4 text-base leading-7 text-slate-300">
              {description}
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Role-based access for staff, approvers, admins, and drivers",
                "AI-powered trip duration estimation and vehicle recommendation",
                "Centralized monitoring for approvals, trips, and fleet activity",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                  <p className="text-sm leading-6 text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Nile University internal transport system
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <AppLogo />
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}