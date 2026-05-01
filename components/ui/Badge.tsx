import { ReactNode } from "react";

type Status = "pending" | "approved" | "rejected" | "posted" | "active" | "past_due" | "cancelled" | "trial";

interface BadgeProps {
  status?: Status;
  children: ReactNode;
  className?: string;
}

const statusClasses: Record<Status, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border border-green-500/30",
  rejected: "bg-brand-pink/20 text-brand-pink border border-brand-pink/30",
  posted: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  active: "bg-green-500/20 text-green-400 border border-green-500/30",
  past_due: "bg-brand-pink/20 text-brand-pink border border-brand-pink/30",
  cancelled: "bg-white/10 text-white/50 border border-white/10",
  trial: "bg-brand-purple/20 text-brand-purple border border-brand-purple/30",
};

export default function Badge({ status, children, className = "" }: BadgeProps) {
  const colorClass = status ? statusClasses[status] : "bg-white/10 text-white/70 border border-white/10";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {children}
    </span>
  );
}
