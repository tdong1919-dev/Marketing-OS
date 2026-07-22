"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

const PLATFORMS: { key: string; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X" },
];

export function ScheduleScriptControl({
  sessionId,
  scriptIndex,
  title,
}: {
  sessionId: string;
  scriptIndex: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(["instagram"]));
  const [busy, setBusy] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit() {
    const platforms = [...selected];
    if (platforms.length === 0) {
      toast.error("Pick at least one platform");
      return;
    }
    setBusy(true);
    toast.info("Writing platform captions…");
    try {
      const res = await fetch(`/api/film-session/${sessionId}/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scriptIndex, platforms }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not schedule");
        return;
      }
      const n = (json.created?.length ?? 0) + (json.updated?.length ?? 0);
      toast.success(
        `Added to Scheduler for ${n} platform${n === 1 ? "" : "s"} — attach a video with the title “${title}”.`,
      );
      setOpen(false);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="xs" onClick={() => setOpen(true)}>
        <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Schedule
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2">
      <span className="text-xs text-muted-foreground">Platforms:</span>
      {PLATFORMS.map((p) => (
        <label key={p.key} className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={selected.has(p.key)}
            onChange={() => toggle(p.key)}
            className="h-3.5 w-3.5"
          />
          {p.label}
        </label>
      ))}
      <Button size="xs" onClick={submit} disabled={busy}>
        {busy ? "Writing…" : "Add to Scheduler"}
      </Button>
      <Button size="xs" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
        Cancel
      </Button>
    </div>
  );
}
