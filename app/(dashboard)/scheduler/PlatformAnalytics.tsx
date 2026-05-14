"use client";
import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from "recharts";
import type { PlatformRow } from "@/app/api/platform-analytics/route";
import Card from "@/components/ui/Card";

// ─── Platform config ────────────────────────────────────────────────────────

const PLATFORMS: Record<string, { label: string; color: string; textColor: string; bg: string; icon: string }> = {
  instagram: { label: "Instagram", color: "#c026d3", textColor: "text-fuchsia-400", bg: "bg-fuchsia-400/10", icon: "📸" },
  facebook:  { label: "Facebook",  color: "#3b82f6", textColor: "text-blue-400",    bg: "bg-blue-400/10",    icon: "👤" },
  x:         { label: "X",         color: "#a1a1aa", textColor: "text-zinc-300",    bg: "bg-zinc-400/10",    icon: "✕" },
  youtube:   { label: "YouTube",   color: "#ef4444", textColor: "text-red-400",     bg: "bg-red-400/10",     icon: "▶" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ─── Derived data ─────────────────────────────────────────────────────────────

type PlatformSummary = {
  platform: string
  latest: PlatformRow
  previous: PlatformRow | null
  followerChange: number
  engagementChange: number
}

function buildSummaries(rows: PlatformRow[]): PlatformSummary[] {
  const byPlatform: Record<string, PlatformRow[]> = {};
  for (const r of rows) {
    (byPlatform[r.platform] ??= []).push(r);
  }
  return Object.entries(byPlatform).map(([platform, rs]) => {
    const sorted = [...rs].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    const previous = sorted[1] ?? null;
    return {
      platform,
      latest,
      previous,
      followerChange: previous ? pctChange(latest.followers, previous.followers) : 0,
      engagementChange: previous ? pctChange(latest.engagement_rate, previous.engagement_rate) : 0,
    };
  });
}

type ChartPoint = Record<string, string | number>;

function buildFollowerChart(rows: PlatformRow[]): ChartPoint[] {
  const byDate: Record<string, ChartPoint> = {};
  for (const r of rows) {
    const label = r.date.slice(5); // MM-DD
    (byDate[r.date] ??= { date: label })[r.platform] = r.followers;
  }
  return Object.values(byDate).sort((a, b) => String(a.date) < String(b.date) ? -1 : 1);
}

function buildEngagementChart(rows: PlatformRow[]): ChartPoint[] {
  const byDate: Record<string, ChartPoint> = {};
  for (const r of rows) {
    const label = r.date.slice(5);
    (byDate[r.date] ??= { date: label })[r.platform] = r.engagement_rate;
  }
  return Object.values(byDate).sort((a, b) => String(a.date) < String(b.date) ? -1 : 1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface-elevated border border-border" />
        ))}
      </div>
      <div className="h-52 rounded-2xl bg-surface-elevated border border-border" />
    </div>
  );
}

function PlatformCard({ s }: { s: PlatformSummary }) {
  const cfg = PLATFORMS[s.platform] ?? { label: s.platform, color: "#888", textColor: "text-text-muted", bg: "bg-surface-elevated", icon: "📊" };
  const hasFollowers = s.latest.followers > 0;
  const up = s.followerChange >= 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-xs font-semibold ${cfg.textColor}`}>
          <span className={`${cfg.bg} px-2 py-1 rounded-lg text-sm`}>{cfg.icon}</span>
          {cfg.label}
        </div>
        {hasFollowers && (
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${up ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
            {up ? "↑" : "↓"} {Math.abs(s.followerChange)}%
          </span>
        )}
      </div>

      <div>
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Followers</p>
        <p className="text-2xl font-bold text-text-primary">{hasFollowers ? fmt(s.latest.followers) : "—"}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
        <div>
          <p className="text-[10px] text-text-muted">Engagement</p>
          <p className="text-xs font-semibold text-text-primary">
            {s.latest.engagement_rate > 0 ? `${s.latest.engagement_rate}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted">Reach</p>
          <p className="text-xs font-semibold text-text-primary">{s.latest.reach > 0 ? fmt(s.latest.reach) : "—"}</p>
        </div>
      </div>
    </div>
  );
}

function MetricsTable({ rows }: { rows: PlatformRow[] }) {
  const latest = Object.values(
    rows.reduce<Record<string, PlatformRow>>((acc, r) => {
      if (!acc[r.platform] || r.date > acc[r.platform].date) acc[r.platform] = r;
      return acc;
    }, {})
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-elevated">
            {["Platform", "Account", "Followers", "Reach", "Impressions", "Likes", "Comments", "Shares", "Saves", "Eng. Rate", "Posts"].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {latest.map((r) => {
            const cfg = PLATFORMS[r.platform];
            return (
              <tr key={r.platform} className="border-b border-border last:border-0 hover:bg-surface-elevated/50 transition-colors">
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className={`flex items-center gap-1.5 font-semibold ${cfg?.textColor ?? "text-text-primary"}`}>
                    <span>{cfg?.icon}</span> {cfg?.label ?? r.platform}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">{r.account_name}</td>
                <td className="px-3 py-2.5 font-medium text-text-primary">{fmt(r.followers)}</td>
                <td className="px-3 py-2.5 text-text-secondary">{fmt(r.reach)}</td>
                <td className="px-3 py-2.5 text-text-secondary">{fmt(r.impressions)}</td>
                <td className="px-3 py-2.5 text-text-secondary">{fmt(r.likes)}</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.comments}</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.shares}</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.saves || "—"}</td>
                <td className="px-3 py-2.5 font-semibold text-text-primary">{r.engagement_rate}%</td>
                <td className="px-3 py-2.5 text-text-secondary">{r.posts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 12 },
  cursor: { stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 },
};

// ─── Main component ───────────────────────────────────────────────────────────

type APIResponse = { data: PlatformRow[]; source: "supabase" | "sheets" | "mock"; error?: string }

export default function PlatformAnalytics() {
  const [data, setData] = useState<PlatformRow[]>([]);
  const [source, setSource] = useState<"supabase" | "sheets" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [chart, setChart] = useState<"followers" | "engagement">("followers");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform-analytics");
      const json: APIResponse = await res.json();
      setData(json.data);
      setSource(json.source);
      setLastSynced(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summaries = buildSummaries(data);
  const chartData = chart === "followers" ? buildFollowerChart(data) : buildEngagementChart(data);
  const activePlatforms = Object.keys(PLATFORMS).filter((p) => summaries.some((s) => s.platform === p));

  // Total aggregate metrics (latest per platform, summed)
  const totals = summaries.reduce(
    (acc, s) => ({
      posts: acc.posts + s.latest.posts,
      reach: acc.reach + s.latest.reach,
      likes: acc.likes + s.latest.likes,
    }),
    { posts: 0, reach: 0, likes: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Internal Only
          </span>
          {source === "mock" && (
            <span className="text-[10px] text-text-muted border border-border px-2 py-0.5 rounded-full">
              Preview data — no live data in range
            </span>
          )}
          {source === "supabase" && (
            <span className="text-[10px] text-emerald-400 border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 rounded-full">
              ● Live from Supabase
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastSynced && (
            <p className="text-[11px] text-text-muted">
              Synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {loading ? "Syncing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <Skeleton />
      ) : (
        <>
          {/* Total aggregate strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Posts Tracked", value: fmt(totals.posts), icon: "📝" },
              { label: "Combined Reach",       value: totals.reach > 0 ? fmt(totals.reach) : "—", icon: "📡" },
              { label: "Total Likes",          value: fmt(totals.likes), icon: "❤️" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-surface-elevated px-4 py-3 flex items-center gap-3">
                <span className="text-xl shrink-0">{m.icon}</span>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{m.label}</p>
                  <p className="text-lg font-bold text-text-primary">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Per-platform cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summaries
              .sort((a, b) => b.latest.followers - a.latest.followers)
              .map((s) => <PlatformCard key={s.platform} s={s} />)}
          </div>

          {/* Chart */}
          <Card
            header={
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-text-primary">14-Day Trend</h2>
                <div className="flex gap-1">
                  {(["followers", "engagement"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setChart(c)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors capitalize font-medium
                        ${chart === c ? "bg-primary/15 text-primary" : "text-text-muted hover:text-text-secondary"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={chart === "followers" ? fmt : (v) => `${v}%`}
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any, name: any) => [
                      chart === "followers" ? fmt(Number(val)) : `${val}%`,
                      PLATFORMS[String(name)]?.label ?? name,
                    ]}
                    labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}
                    {...TOOLTIP_STYLE}
                  />
                  <Legend
                    formatter={(v) => PLATFORMS[v]?.label ?? v}
                    wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}
                  />
                  {activePlatforms.map((p) => (
                    <Line
                      key={p}
                      type="monotone"
                      dataKey={p}
                      stroke={PLATFORMS[p]?.color ?? "#888"}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Engagement bar chart */}
          <Card header={<h2 className="text-sm font-semibold text-text-primary">Engagement Rate by Platform</h2>}>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summaries.map((s) => ({
                    name: PLATFORMS[s.platform]?.label ?? s.platform,
                    rate: s.latest.engagement_rate,
                    color: PLATFORMS[s.platform]?.color ?? "#888",
                  }))}
                  barSize={36}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [`${val}%`, "Engagement"]}
                    {...TOOLTIP_STYLE}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                    {summaries.map((s, i) => (
                      <Cell key={i} fill={PLATFORMS[s.platform]?.color ?? "#888"} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Full metrics table */}
          <Card header={<h2 className="text-sm font-semibold text-text-primary">Latest Snapshot — All Platforms</h2>}>
            <MetricsTable rows={data} />
          </Card>

          {/* Nudge if no live data returned */}
          {source === "mock" && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex gap-3 items-start">
              <span className="text-xl shrink-0">📭</span>
              <div>
                <p className="text-sm font-semibold text-text-primary mb-1">No data in the last 90 days</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Showing preview data. Once your n8n flow writes rows to the <code className="bg-surface border border-border px-1 rounded text-[11px]">platform_analytics</code> table in Supabase, this dashboard will automatically display live metrics.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
