import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon?: ReactNode;
  highlight?: boolean;
  className?: string;
}

export default function MetricCard({
  title, value, change, changePositive = true, icon, highlight, className = "",
}: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200
        ${highlight
          ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_rgba(57,255,20,0.08)]"
          : "border-border bg-surface-elevated hover:border-border/80"
        } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">{title}</p>
        {icon && <div className="text-text-muted">{icon}</div>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className={`text-3xl font-bold tracking-tight ${highlight ? "text-primary" : "text-text-primary"}`}>
          {value}
        </p>
        {change && (
          <span className={`text-xs font-medium pb-1 ${changePositive ? "text-success" : "text-error"}`}>
            {changePositive ? "↑" : "↓"} {change}
          </span>
        )}
      </div>
    </div>
  );
}
