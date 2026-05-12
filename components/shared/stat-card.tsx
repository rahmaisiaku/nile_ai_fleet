import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 truncate text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          {helper ? (
            <p className="mt-2 truncate text-sm text-slate-500">{helper}</p>
          ) : null}
        </div>

        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0">
              {icon}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}