import { NextResponse } from "next/server";

import { runJidokaAnalyticsFetch } from "@/lib/social/analytics-fetcher";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const backfill = url.searchParams.get("backfill") === "1";
  const days = Number(url.searchParams.get("days") ?? "90");
  const platform = url.searchParams.get("platform");
  const result = await runJidokaAnalyticsFetch({
    platforms: platform && platform !== "all" ? [platform] : undefined,
    lookbackDays: backfill && Number.isFinite(days) ? days : undefined,
    maxPostsPerAccount: backfill ? 500 : undefined,
  });
  return NextResponse.json({ ok: true, ...result });
}

export const POST = GET;
