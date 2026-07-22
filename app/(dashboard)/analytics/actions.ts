"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { runJidokaAnalyticsFetch } from "@/lib/social/analytics-fetcher";

const BACKFILL_SUPPORTED_PLATFORMS = new Set(["instagram", "facebook", "youtube", "x"]);

function clampDays(value: FormDataEntryValue | null) {
  const days = Number(value ?? 90);
  if (!Number.isFinite(days)) return 90;
  return Math.max(7, Math.min(Math.round(days), 730));
}

function maxPostsForDays(days: number) {
  if (days <= 30) return 100;
  if (days <= 90) return 200;
  return 500;
}

export async function backfillAnalyticsAction(formData: FormData) {
  const { user } = await requireUser();
  const days = clampDays(formData.get("days"));
  const requestedPlatform = String(formData.get("platform") ?? "all")
    .trim()
    .toLowerCase();
  const platform = BACKFILL_SUPPORTED_PLATFORMS.has(requestedPlatform)
    ? requestedPlatform
    : "all";
  const agentId = String(formData.get("agent_id") ?? "").trim();

  const result = await runJidokaAnalyticsFetch({
    ownerId: user.id,
    agentId: agentId || undefined,
    platforms: platform && platform !== "all" ? [platform] : undefined,
    lookbackDays: days,
    maxPostsPerAccount: maxPostsForDays(days),
  });

  revalidatePath("/analytics");
  revalidatePath("/scheduler");
  revalidatePath("/dashboard");

  const params = new URLSearchParams({
    platform: platform || "all",
    backfill: "success",
    days: String(days),
    rows: String(result.rows_stored),
    accounts: String(result.accounts_processed),
    errors: String(result.errors),
  });
  redirect(`/analytics?${params.toString()}`);
}
