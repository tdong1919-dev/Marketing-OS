type SpinnerSize = "sm" | "md" | "lg" | "page";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
  page: "h-12 w-12 border-4",
};

export default function Spinner({ size = "md", color = "border-brand-purple" }: SpinnerProps) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-transparent ${color} border-t-current ${sizeMap[size]}`}
      style={{ borderTopColor: "currentColor" }}
    />
  );

  if (size === "page") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-charcoal/80 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
