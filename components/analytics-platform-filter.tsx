"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type PlatformOption = { key: string; label: string };

export function AnalyticsPlatformFilter({
  platform,
  options,
}: {
  platform: string;
  options: PlatformOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const activeLoadingPlatform = loadingPlatform === platform ? null : loadingPlatform;
  const isLoading = pending || activeLoadingPlatform !== null;

  function selectPlatform(nextPlatform: string) {
    if (nextPlatform === platform || isLoading) return;
    setLoadingPlatform(nextPlatform);
    startTransition(() => {
      router.push(`/analytics?platform=${nextPlatform}`);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const selected = platform === item.key;
          const loading = activeLoadingPlatform === item.key;
          return (
            <Button
              key={item.key}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              disabled={isLoading}
              onClick={() => selectPlatform(item.key)}
            >
              {loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              {item.label}
            </Button>
          );
        })}
      </div>
      {isLoading && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading analytics. This can take a moment when switching platforms.
        </div>
      )}
    </div>
  );
}
