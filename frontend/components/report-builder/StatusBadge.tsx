type StatusBadgeVariant =
  | "pending"
  | "success"
  | "warning"
  | "error"
  | "info";

type StatusBadgeProps = {
  label: string;
  variant: StatusBadgeVariant;
};

const variantClasses: Record<StatusBadgeVariant, string> = {
  pending: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  success: "bg-lime-500/20 text-lime-300 border-lime-500/40",
  warning: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  error: "bg-red-500/20 text-red-300 border-red-500/40",
  info: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
};

export function StatusBadge({
  label,
  variant,
}: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}