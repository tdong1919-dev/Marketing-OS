import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/supabase/types";

const STYLES: Record<AgentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  analyzing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const LABELS: Record<AgentStatus, string> = {
  draft: "Draft",
  analyzing: "Analyzing…",
  ready: "Ready",
  error: "Error",
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <Badge className={cn("border-0 font-medium", STYLES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
