import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Authenticity score badge. >=90 passes QC; 75-89 warn; <75 fail. */
export function ScoreBadge({
  score,
  label,
}: {
  score: number;
  label?: string;
}) {
  const rounded = Math.round(score);
  const tone =
    rounded >= 90
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : rounded >= 75
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";

  return (
    <Badge className={cn("border-0 font-semibold tabular-nums", tone)}>
      {label ? `${label}: ` : ""}
      {rounded}
    </Badge>
  );
}
