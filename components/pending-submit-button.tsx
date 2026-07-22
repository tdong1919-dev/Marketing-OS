"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Submit button for server-action forms that shows a spinner and an
 * indeterminate progress bar while the action runs, so long agent work
 * (scans, analysis) never looks like a frozen page. Must be rendered
 * inside the <form> it submits.
 */
export function PendingSubmitButton({
  children,
  pendingLabel,
  pendingHint,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  pendingHint?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-3">
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        {pending ? pendingLabel : children}
      </Button>
      {pending && (
        <div className="space-y-2">
          <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-primary [animation:loading-slide_1.2s_ease-in-out_infinite]" />
          </div>
          {pendingHint && (
            <p className="text-xs text-muted-foreground">{pendingHint}</p>
          )}
        </div>
      )}
    </div>
  );
}
