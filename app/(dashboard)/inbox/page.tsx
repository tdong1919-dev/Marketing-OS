"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";

// ─── Types ──────────────────────────────────────────────────────────────────
interface LogItem {
  id: string; kind: "comment" | "dm"; platform: string;
  who: string; incoming: string; response: string; ts: string | null;
}
interface ReviewItem {
  id: string; kind: "comment" | "dm"; refId: string; externalId: string | null;
  platform: string; who: string; incoming: string; draft: string; reason: string; ts: string | null;
}
type Tab = "posted" | "review" | "approved";

const PLATFORM: Record<string, { label: string; icon: string; text: string }> = {
  instagram: { label: "Instagram", icon: "📸", text: "text-fuchsia-400" },
  facebook:  { label: "Facebook",  icon: "👤", text: "text-blue-400" },
  x:         { label: "X",         icon: "✕",  text: "text-zinc-300" },
  youtube:   { label: "YouTube",   icon: "▶",  text: "text-red-400" },
  reddit:    { label: "Reddit",    icon: "🟠", text: "text-orange-400" },
};

const fmtTs = (ts: string | null) =>
  ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

function ChannelTag({ kind, platform }: { kind: "comment" | "dm"; platform: string }) {
  const p = PLATFORM[platform] ?? { label: platform, icon: "📄", text: "text-text-muted" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${p.text}`}>
      <span>{p.icon}</span>{p.label} · {kind === "dm" ? "DM" : "Comment"}
    </span>
  );
}

export default function InboxPage() {
  const [posted, setPosted] = useState<LogItem[]>([]);
  const [needsReview, setNeedsReview] = useState<ReviewItem[]>([]);
  const [approved, setApproved] = useState<LogItem[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posted");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox");
      const json = await res.json();
      setPosted(json.posted ?? []);
      setNeedsReview(json.needsReview ?? []);
      setApproved(json.approved ?? []);
      setPlatforms(json.platforms ?? []);
    } catch {
      /* empty state shown */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byFilters = <T extends { platform: string; who: string; incoming: string }>(items: T[], extra: (i: T) => string) => {
    let r = items;
    if (platformFilter !== "all") r = r.filter((i) => i.platform === platformFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((i) => i.who.toLowerCase().includes(q) || i.incoming.toLowerCase().includes(q) || extra(i).toLowerCase().includes(q));
    }
    return r;
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  const postedF = useMemo(() => byFilters(posted, (i) => i.response), [posted, platformFilter, search]);
  const approvedF = useMemo(() => byFilters(approved, (i) => i.response), [approved, platformFilter, search]);
  const reviewF = useMemo(() => byFilters(needsReview, (i) => i.draft), [needsReview, platformFilter, search]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const counts = { posted: posted.length, review: needsReview.length, approved: approved.length };

  // Currently selected item for the detail panel
  const selectedReview = tab === "review" ? reviewF.find((i) => i.id === selectedId) ?? reviewF[0] : undefined;
  const selectedLog = tab !== "review"
    ? (tab === "posted" ? postedF : approvedF).find((i) => i.id === selectedId) ?? (tab === "posted" ? postedF : approvedF)[0]
    : undefined;

  // When a review item is selected, prime the editable draft.
  useEffect(() => {
    if (selectedReview) { setDraft(selectedReview.draft); setActionError(""); }
  }, [selectedReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (item: ReviewItem, action: "approve" | "reject") => {
    setBusy(true); setActionError("");
    try {
      const res = await fetch("/api/inbox/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: item.kind, refId: item.refId, text: draft, action }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Action failed");
      setSelectedId(null);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "posted", label: "Posted", count: counts.posted },
    { id: "review", label: "Needs Review", count: counts.review },
    { id: "approved", label: "Approved", count: counts.approved },
  ];

  const list = tab === "review" ? reviewF : tab === "posted" ? postedF : approvedF;
  const emptyCopy = tab === "review"
    ? { icon: "✅", title: "Nothing to review", sub: "Escalated comments & DMs that need your approval show up here." }
    : tab === "approved"
    ? { icon: "📨", title: "No approved items yet", sub: "Replies you approve & send from Needs Review appear here." }
    : { icon: "📜", title: "No responses yet", sub: "Every comment & DM Autom8 auto-responds to is logged here." };

  return (
    <div className="flex h-full bg-bg">
      {/* Left column: list */}
      <div className="flex flex-col w-full md:w-80 lg:w-96 border-r border-border shrink-0 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">Inbox</h1>
          <p className="text-xs text-text-muted">Every AI response, plus anything that needs your approval.</p>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelectedId(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                ${tab === t.id ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"}`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? "bg-primary/20 text-primary" : "bg-border text-text-muted"}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Platform filter */}
        {platforms.length > 1 && (
          <div className="px-4 py-2.5 border-b border-border">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-primary/40 cursor-pointer"
            >
              <option value="all">All platforms</option>
              {platforms.map((p) => <option key={p} value={p}>{PLATFORM[p]?.label ?? p}</option>)}
            </select>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3 animate-pulse">💬</div>
              <p className="text-sm font-medium text-text-secondary">Loading…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="text-4xl mb-3">{emptyCopy.icon}</div>
              <p className="text-sm font-medium text-text-secondary">{emptyCopy.title}</p>
              <p className="text-xs text-text-muted mt-1">{emptyCopy.sub}</p>
            </div>
          ) : (
            list.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all
                  ${selectedId === item.id ? "border-primary/40 bg-primary/5" : "border-border bg-surface hover:bg-surface-elevated"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <ChannelTag kind={item.kind} platform={item.platform} />
                  <span className="text-[10px] text-text-muted shrink-0">{fmtTs(item.ts)}</span>
                </div>
                <p className="text-xs font-medium text-text-primary truncate">{item.who}</p>
                <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">{item.incoming || "—"}</p>
                {tab === "review" && (
                  <span className="inline-block mt-1.5 text-[10px] text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded-full">
                    {(item as ReviewItem).reason}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right column: detail */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-bg">
        {tab === "review" ? (
          selectedReview ? (
            <ReviewDetail item={selectedReview} draft={draft} setDraft={setDraft} busy={busy} error={actionError}
              onApprove={() => act(selectedReview, "approve")} onReject={() => act(selectedReview, "reject")} />
          ) : <EmptyDetail icon="✅" text="Nothing needs review" sub="You're all caught up." />
        ) : selectedLog ? (
          <LogDetail item={selectedLog} />
        ) : <EmptyDetail icon="📜" text="Select an item" sub="Pick a response to see the full exchange." />}
      </div>

      {/* Mobile detail overlay */}
      {selectedId && (
        <div className="fixed inset-0 z-50 md:hidden bg-bg overflow-y-auto">
          <div className="p-4">
            <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-sm text-text-secondary mb-4 hover:text-text-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Inbox
            </button>
            {tab === "review" && selectedReview ? (
              <ReviewDetail item={selectedReview} draft={draft} setDraft={setDraft} busy={busy} error={actionError}
                onApprove={() => act(selectedReview, "approve")} onReject={() => act(selectedReview, "reject")} />
            ) : selectedLog ? <LogDetail item={selectedLog} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail panels ────────────────────────────────────────────────────────────
function Exchange({ who, incoming, response, label }: { who: string; incoming: string; response: string; label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
          {who.replace("@", "").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 bg-surface rounded-xl px-3 py-2">
          <p className="text-xs font-medium text-text-secondary mb-0.5">{who}</p>
          <p className="text-xs text-text-primary whitespace-pre-wrap">{incoming || "—"}</p>
        </div>
      </div>
      <div className="flex items-start gap-2 pl-6">
        <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mt-0.5">AI</div>
        <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
          <p className="text-xs font-medium text-primary/70 mb-0.5">{label}</p>
          <p className="text-xs text-text-primary whitespace-pre-wrap">{response || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function LogDetail({ item }: { item: LogItem }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <ChannelTag kind={item.kind} platform={item.platform} />
          <span className="text-xs text-text-muted">{fmtTs(item.ts)}</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-elevated p-5">
          <Exchange who={item.who} incoming={item.incoming} response={item.response} label="Autom8 AI — sent" />
        </div>
      </div>
    </div>
  );
}

function ReviewDetail({
  item, draft, setDraft, busy, error, onApprove, onReject,
}: {
  item: ReviewItem; draft: string; setDraft: (v: string) => void; busy: boolean; error: string;
  onApprove: () => void; onReject: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <ChannelTag kind={item.kind} platform={item.platform} />
          <span className="text-xs text-text-muted">{fmtTs(item.ts)}</span>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-2.5 text-xs text-warning">{item.reason}</div>

        {/* Incoming message */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-5">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
              {item.who.replace("@", "").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 bg-surface rounded-xl px-3 py-2">
              <p className="text-xs font-medium text-text-secondary mb-0.5">{item.who}</p>
              <p className="text-xs text-text-primary whitespace-pre-wrap">{item.incoming || "—"}</p>
            </div>
          </div>
        </div>

        {/* Editable response */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Your response {item.kind === "comment" ? "(posts as a public reply)" : "(sends as a DM)"}
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder={item.kind === "comment" ? "Write the reply to post…" : "Write the DM to send…"}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/40 resize-none"
          />
          {item.kind === "comment" && !item.draft && (
            <p className="text-[11px] text-text-muted mt-1">No AI draft (this was flagged before drafting). Write your reply above.</p>
          )}
        </div>

        {error && <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-2.5 text-sm text-error">{error}</div>}

        <div className="flex gap-2">
          <Button variant="primary" loading={busy} onClick={onApprove} className="flex-1" disabled={!draft.trim()}>
            ✓ Approve &amp; Send
          </Button>
          <Button variant="secondary" onClick={onReject} disabled={busy}>Reject</Button>
        </div>
      </div>
    </div>
  );
}

function EmptyDetail({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <p className="text-text-secondary font-medium">{text}</p>
        <p className="text-xs text-text-muted mt-1">{sub}</p>
      </div>
    </div>
  );
}
