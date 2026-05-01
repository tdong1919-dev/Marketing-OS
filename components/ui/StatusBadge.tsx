type Status = "auto" | "review" | "escalated" | "approved" | "sent" | "pending";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const config: Record<Status, { label: string; classes: string; dot: string }> = {
  auto:      { label: "Auto",      classes: "bg-success/10 text-success border border-success/20",         dot: "bg-success" },
  approved:  { label: "Approved",  classes: "bg-success/10 text-success border border-success/20",         dot: "bg-success" },
  sent:      { label: "Sent",      classes: "bg-primary/10 text-primary border border-primary/20",         dot: "bg-primary" },
  review:    { label: "Review",    classes: "bg-warning/10 text-warning border border-warning/20",         dot: "bg-warning" },
  pending:   { label: "Pending",   classes: "bg-warning/10 text-warning border border-warning/20",         dot: "bg-warning" },
  escalated: { label: "Escalated", classes: "bg-error/10 text-error border border-error/20",               dot: "bg-error" },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.classes} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
