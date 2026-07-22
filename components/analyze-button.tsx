"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { readJsonResponse } from "@/lib/client-response";

export function AnalyzeButton({
  agentId,
  disabled,
  label = "Run Voice Intelligence Analysis",
}: {
  agentId: string;
  disabled?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [pending, startTransition] = useTransition();

  async function analyze() {
    setRunning(true);
    toast.info("Analyzing voice — this can take a minute…");
    try {
      const res = await fetch(`/api/agents/${agentId}/analyze`, {
        method: "POST",
      });
      const json = await readJsonResponse(res);
      if (!res.ok) {
        toast.error(json.error ?? "Analysis failed");
        return;
      }
      toast.success("Analysis complete");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error during analysis");
    } finally {
      setRunning(false);
    }
  }

  const busy = running || pending;
  return (
    <Button onClick={analyze} disabled={disabled || busy}>
      {busy ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-1 h-4 w-4" />
      )}
      {busy ? "Analyzing…" : label}
    </Button>
  );
}
