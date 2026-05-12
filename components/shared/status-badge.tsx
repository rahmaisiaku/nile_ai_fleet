type Status =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Allocated"
  | "In Trip"
  | "Completed";

type StatusBadgeProps = {
  status: Status;
};

/**
 * Small reusable status badge.
 * This keeps status colors consistent across tables, cards, and dashboards.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<Status, string> = {
    Pending: "bg-amber-50 text-amber-700",
    Approved: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-red-50 text-red-700",
    Allocated: "bg-blue-50 text-blue-700",
    "In Trip": "bg-violet-50 text-violet-700",
    Completed: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}