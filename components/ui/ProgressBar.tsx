interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function ProgressBar({ value, showLabel = true, size = "md" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const color = clamped >= 80 ? "bg-brand-pink" : clamped >= 60 ? "bg-yellow-400" : "bg-neon";
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="flex flex-col gap-1">
      <div className={`w-full bg-surface-2 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-white/50">{clamped.toFixed(0)}%</span>
      )}
    </div>
  );
}
