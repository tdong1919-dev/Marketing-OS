"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export type DashboardChecklistStep = {
  id: string;
  label: string;
  href: string;
  autoDone: boolean;
};

const STORAGE_KEY = "jidoka-dashboard-checklist-v1";

export function DashboardChecklist({
  steps,
}: {
  steps: DashboardChecklistStep[];
}) {
  const [manualDone, setManualDone] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(manualDone));
  }, [manualDone]);

  const completeIds = useMemo(
    () => new Set([...manualDone, ...steps.filter((step) => step.autoDone).map((step) => step.id)]),
    [manualDone, steps],
  );
  const nextStep = steps.find((step) => !completeIds.has(step.id));
  const completedCount = steps.filter((step) => completeIds.has(step.id)).length;

  function toggle(id: string) {
    setManualDone((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Setup checklist
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount} of {steps.length} complete. Check items off yourself or let Jidoka Marketing Team OS mark them as data appears.
          </p>
        </div>
        {nextStep ? (
          <ButtonLink href={nextStep.href}>
            Continue
            <ArrowRight className="ml-1 h-4 w-4" />
          </ButtonLink>
        ) : (
          <ButtonLink href="/scheduler" variant="outline">
            Open scheduler
          </ButtonLink>
        )}
      </div>
      <div className="divide-y">
        {steps.map((step) => {
          const checked = completeIds.has(step.id);
          return (
            <div
              key={step.id}
              className="flex items-center gap-3 p-4"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={step.autoDone}
                onChange={() => toggle(step.id)}
                className="h-4 w-4 accent-primary"
                aria-label={step.label}
              />
              <Link
                href={step.href}
                className="min-w-0 flex-1 text-sm font-medium hover:text-primary"
              >
                {step.label}
              </Link>
              <span className="text-xs text-muted-foreground">
                {step.autoDone ? "Auto" : checked ? "Done" : "Manual"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
