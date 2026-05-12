import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
};

export function FormField({
  label,
  htmlFor,
  children,
  hint,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      {children}

      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}