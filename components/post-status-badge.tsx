import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/supabase/types";

const STYLES: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  posting: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  posted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function PostStatusBadge({ status }: { status: string }) {
  const s = (status as PostStatus) in STYLES ? (status as PostStatus) : "draft";
  return (
    <Badge className={cn("border-0 font-medium capitalize", STYLES[s])}>
      {status}
    </Badge>
  );
}
