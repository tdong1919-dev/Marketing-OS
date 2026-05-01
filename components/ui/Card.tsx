import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  glow?: boolean;
  glass?: boolean;
}

export default function Card({ children, header, footer, className = "", glow, glass }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border
        ${glass ? "glass" : "bg-surface-elevated"}
        ${glow ? "shadow-[0_0_20px_rgba(57,255,20,0.08)] hover:shadow-[0_0_28px_rgba(57,255,20,0.15)] transition-shadow duration-300" : ""}
        ${className}`}
    >
      {header && <div className="px-5 py-4 border-b border-border">{header}</div>}
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="px-5 py-4 border-t border-border">{footer}</div>}
    </div>
  );
}
