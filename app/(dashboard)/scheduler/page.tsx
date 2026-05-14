"use client";
import { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PlatformAnalytics from "./PlatformAnalytics";
import { useAuth } from "@/lib/auth-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "tdong1919@gmail.com";

type ContentType = "short_video" | "carousel" | "post";

const contentTypes: { id: ContentType; label: string; icon: string; note: string }[] = [
  { id: "short_video", label: "Short-Form Video", icon: "🎬", note: "Reels, TikToks, Shorts — vertical 9:16 format" },
  { id: "carousel",    label: "Carousel",          icon: "🖼️", note: "Up to 10 slides, square or portrait format" },
  { id: "post",        label: "Post / Static Image",icon: "🖼",  note: "Single image or graphic — keep your grid layout in mind" },
];

type Platform = "instagram" | "facebook" | "x" | "youtube";

const PLATFORMS: Record<Platform, { label: string; icon: string; color: string; textColor: string }> = {
  instagram: { label: "Instagram", icon: "📸", color: "#c026d3", textColor: "text-fuchsia-400" },
  facebook:  { label: "Facebook",  icon: "👤", color: "#3b82f6", textColor: "text-blue-400"   },
  x:         { label: "X",         icon: "✕",  color: "#a1a1aa", textColor: "text-zinc-300"   },
  youtube:   { label: "YouTube",   icon: "▶",  color: "#ef4444", textColor: "text-red-400"    },
};

// ─── Deeper Analytics data ────────────────────────────────────────────────────

type DaySlot = { day: string; time: string; score: number };

const platformBestTimes: Record<Platform, DaySlot[]> = {
  instagram: [
    { day: "Mon", time: "11 AM–1 PM",  score: 78 },
    { day: "Tue", time: "7–9 PM",      score: 88 },
    { day: "Wed", time: "11 AM–1 PM",  score: 82 },
    { day: "Thu", time: "7–9 PM",      score: 95 },
    { day: "Fri", time: "12–2 PM",     score: 85 },
    { day: "Sat", time: "9–11 AM",     score: 72 },
    { day: "Sun", time: "6–8 PM",      score: 68 },
  ],
  facebook: [
    { day: "Mon", time: "9–11 AM",     score: 75 },
    { day: "Tue", time: "1–3 PM",      score: 85 },
    { day: "Wed", time: "9 AM–12 PM",  score: 80 },
    { day: "Thu", time: "1–3 PM",      score: 91 },
    { day: "Fri", time: "10 AM–12 PM", score: 82 },
    { day: "Sat", time: "10 AM–1 PM",  score: 70 },
    { day: "Sun", time: "12–2 PM",     score: 65 },
  ],
  x: [
    { day: "Mon", time: "8–10 AM",     score: 80 },
    { day: "Tue", time: "8–10 AM",     score: 85 },
    { day: "Wed", time: "9 AM–12 PM",  score: 78 },
    { day: "Thu", time: "12–3 PM",     score: 90 },
    { day: "Fri", time: "8–10 AM",     score: 88 },
    { day: "Sat", time: "9 AM–12 PM",  score: 72 },
    { day: "Sun", time: "12–3 PM",     score: 65 },
  ],
  youtube: [
    { day: "Mon", time: "2–4 PM",      score: 75 },
    { day: "Tue", time: "2–4 PM",      score: 82 },
    { day: "Wed", time: "2–4 PM",      score: 79 },
    { day: "Thu", time: "2–4 PM",      score: 85 },
    { day: "Fri", time: "12–3 PM",     score: 88 },
    { day: "Sat", time: "9 AM–12 PM",  score: 93 },
    { day: "Sun", time: "9 AM–12 PM",  score: 90 },
  ],
};

const platformInsights: Record<Platform, { label: string; value: string }[]> = {
  instagram: [
    { label: "Avg. Engagement Rate", value: "3.2%" },
    { label: "Best Content Type",    value: "Reels" },
    { label: "Avg. Reach per Post",  value: "8.4K" },
    { label: "Saves Rate",           value: "1.8%" },
    { label: "Peak Audience Age",    value: "25–34" },
  ],
  facebook: [
    { label: "Avg. Engagement Rate", value: "1.8%" },
    { label: "Best Content Type",    value: "Video" },
    { label: "Avg. Reach per Post",  value: "3.2K" },
    { label: "Link Click Rate",      value: "0.9%" },
    { label: "Peak Audience Age",    value: "35–44" },
  ],
  x: [
    { label: "Avg. Engagement Rate", value: "1.2%" },
    { label: "Best Content Type",    value: "Threads" },
    { label: "Avg. Impressions",     value: "6.8K" },
    { label: "Retweet Rate",         value: "0.7%" },
    { label: "Peak Audience Age",    value: "18–34" },
  ],
  youtube: [
    { label: "Avg. View Duration",   value: "4m 12s" },
    { label: "Best Content Length",  value: "8–12 min" },
    { label: "Avg. Views per Video", value: "1.2K" },
    { label: "Subscriber Rate",      value: "0.4%" },
    { label: "Peak Audience Age",    value: "25–44" },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BestTimesCard({ platform }: { platform: Platform }) {
  const slots = platformBestTimes[platform];
  const cfg = PLATFORMS[platform];
  const maxScore = Math.max(...slots.map((s) => s.score));

  return (
    <Card header={
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${cfg.textColor}`}>{cfg.icon} {cfg.label}</span>
        <span className="text-[10px] text-text-muted">— Best times to post</span>
      </div>
    }>
      <div className="space-y-2">
        {slots.map((slot) => {
          const isBest = slot.score === maxScore;
          return (
            <div key={slot.day} className="flex items-center gap-3">
              <span className="text-xs font-medium text-text-secondary w-8 shrink-0">{slot.day}</span>
              <div className="flex-1 h-6 bg-surface rounded-lg overflow-hidden">
                <div
                  className={`h-full rounded-lg flex items-center px-2.5 transition-all duration-700 ${
                    isBest ? "shadow-[0_0_10px_rgba(123,63,242,0.25)]" : ""
                  }`}
                  style={{
                    width: `${slot.score}%`,
                    background: isBest ? cfg.color : `${cfg.color}40`,
                  }}
                >
                  <span className="text-[10px] text-white font-semibold whitespace-nowrap">{slot.time}</span>
                </div>
              </div>
              <span className={`text-xs font-bold w-7 text-right shrink-0 ${isBest ? cfg.textColor : "text-text-muted"}`}>
                {slot.score}
              </span>
              {isBest && <span className="text-[10px] shrink-0">🔥</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MetricsCard({ platform }: { platform: Platform }) {
  const cfg = PLATFORMS[platform];
  const insights = platformInsights[platform];

  return (
    <Card header={
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${cfg.textColor}`}>{cfg.icon} {cfg.label}</span>
        <span className="text-[10px] text-text-muted">— Key metrics</span>
      </div>
    }>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {insights.map((m) => (
          <div key={m.label} className="rounded-lg bg-surface border border-border px-3 py-2.5">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{m.label}</p>
            <p className="text-sm font-bold text-text-primary">{m.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["instagram"]);
  const [contentDesc, setContentDesc] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "insights" | "analytics">("upload");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (p: Platform) => {
    if (!isAdmin && p !== "instagram") return;
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setUploadedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setCsvFile(e.target.files[0]);
  };

  const removeFile = (idx: number) => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || selectedPlatforms.length === 0) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-5 md:p-7 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Content Queued!</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Your content is being processed by the AI — SEO captions, hashtags, and titles will be
            generated and scheduled to post at peak activity times for maximum exposure.
          </p>
          <Button variant="primary" onClick={() => {
            setSubmitted(false); setUploadedFiles([]); setCsvFile(null);
            setContentDesc(""); setSelectedType(null); setSelectedPlatforms(["instagram"]);
          }}>
            Schedule More Content →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Content</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Smart Scheduler</h1>
        <p className="text-sm text-text-secondary mt-1">
          Upload your content, describe the topic, and let AI handle captions, hashtags &amp; titles — then we post it for you.
        </p>
      </div>

      {/* Workflow explainer */}
      <div className="rounded-xl border border-border bg-surface-elevated p-4 flex flex-col sm:flex-row items-start gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">📤</span>
          <span className="text-xs text-text-muted">Upload</span>
        </div>
        <div className="hidden sm:block text-text-muted text-lg mt-0.5">→</div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🤖</span>
          <span className="text-xs text-text-muted">AI adds SEO captions, hashtags, and titles</span>
        </div>
        <div className="hidden sm:block text-text-muted text-lg mt-0.5">→</div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">📅</span>
          <span className="text-xs text-text-muted">Auto-schedule to post at peak times</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {[
          { id: "upload"    as const, label: "Schedule Content",  icon: "📤" },
          { id: "insights"  as const, label: "Deeper Analytics",  icon: "📊" },
          { id: "analytics" as const, label: "Platform Analytics",icon: "📈", internal: true },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
          >
            <span>{tab.icon}</span> {tab.label}
            {"internal" in tab && tab.internal && (
              <span className="text-[9px] font-bold bg-amber-400/15 text-amber-400 px-1.5 py-0.5 rounded-full">Internal</span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: Schedule Content */}
      {activeTab === "upload" && (
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Step 0: Platform selection */}
          <Card header={<h2 className="text-sm font-semibold text-text-primary">1 · Choose platforms</h2>}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.entries(PLATFORMS) as [Platform, typeof PLATFORMS[Platform]][]).map(([key, cfg]) => {
                const locked = !isAdmin && key !== "instagram";
                const selected = selectedPlatforms.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePlatform(key)}
                    disabled={locked}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all
                      ${locked
                        ? "border-border bg-surface opacity-50 cursor-not-allowed"
                        : selected
                          ? "border-primary/40 bg-primary/8 shadow-[0_0_16px_rgba(123,63,242,0.08)]"
                          : "border-border bg-surface hover:border-primary/20 cursor-pointer"
                      }`}
                  >
                    <span className="text-2xl">{cfg.icon}</span>
                    <p className={`text-xs font-semibold ${cfg.textColor}`}>{cfg.label}</p>
                    {locked ? (
                      <span className="text-[10px] text-text-muted border border-border px-2 py-0.5 rounded-full mt-0.5">
                        Coming Soon
                      </span>
                    ) : selected ? (
                      <span className="text-[10px] text-primary font-bold">✓ Selected</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {!isAdmin && (
              <p className="text-[11px] text-text-muted mt-3 text-center">
                Facebook, X, and YouTube scheduling coming soon.
              </p>
            )}
          </Card>

          {/* Step 1: Content type */}
          <Card header={<h2 className="text-sm font-semibold text-text-primary">2 · What are you posting?</h2>}>
            <div className="grid sm:grid-cols-3 gap-3">
              {contentTypes.map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setSelectedType(ct.id)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all
                    ${selectedType === ct.id
                      ? "border-primary/40 bg-primary/8 shadow-[0_0_16px_rgba(123,63,242,0.08)]"
                      : "border-border bg-surface hover:border-primary/20"
                    }`}
                >
                  <span className="text-2xl">{ct.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{ct.label}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{ct.note}</p>
                  </div>
                  {selectedType === ct.id && <span className="text-xs text-primary font-semibold">✓ Selected</span>}
                </button>
              ))}
            </div>

            {selectedType === "post" && (
              <div className="mt-3 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 flex gap-2">
                <span className="text-warning shrink-0">⚠</span>
                <p className="text-xs text-warning leading-relaxed">
                  <strong>Grid reminder:</strong> Posts are permanent on your profile grid. Make sure your image is properly formatted (square 1:1 or portrait 4:5) and fits your overall grid aesthetic before scheduling.
                </p>
              </div>
            )}
          </Card>

          {/* Step 2: Upload */}
          <Card header={<h2 className="text-sm font-semibold text-text-primary">3 · Upload your content</h2>}>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm font-medium text-text-primary">Drop photos or videos here</p>
                <p className="text-xs text-text-muted mt-1">JPG, PNG, MP4, MOV — up to 500MB per file</p>
                <button type="button" className="mt-3 text-xs text-primary border border-primary/30 rounded-lg px-4 py-1.5 hover:bg-primary/5 transition-colors">
                  Browse Files
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
                <span className="text-2xl shrink-0">📊</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">Bulk schedule via CSV</p>
                  <p className="text-xs text-text-muted">Upload a CSV with content URLs, captions &amp; schedule times</p>
                  {csvFile && <p className="text-xs text-primary mt-1">✓ {csvFile.name}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="shrink-0 text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
                >
                  Upload CSV
                </button>
                <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvChange} />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Queued files</p>
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                      <span className="text-lg">{file.type.startsWith("video") ? "🎬" : "🖼️"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary truncate">{file.name}</p>
                        <p className="text-[10px] text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button type="button" onClick={() => removeFile(idx)} className="text-text-muted hover:text-error transition-colors text-sm">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Step 3: AI description */}
          <Card header={<h2 className="text-sm font-semibold text-text-primary">4 · Tell the AI what this content is about</h2>}>
            <p className="text-xs text-text-muted mb-3">
              Describe the topic, message, or goal — the AI will write SEO captions, titles, and hashtags based on your brand voice.
            </p>
            <textarea
              value={contentDesc}
              onChange={(e) => setContentDesc(e.target.value)}
              placeholder="e.g. 'This video shows our new summer collection launch — target audience is women 25–35 who love fashion. Vibe is aspirational but approachable. Include a CTA to shop the link in bio.'"
              rows={4}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary/40 transition-colors resize-none"
            />
            <div className="mt-3 rounded-lg border border-border bg-surface-elevated px-4 py-3">
              <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">AI will generate:</p>
              <div className="flex flex-wrap gap-2">
                {["SEO Caption", "Title / Hook", "30+ Hashtags", "Alt text", "Best posting time"].map((item) => (
                  <span key={item} className="text-[11px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-text-muted">
              Content → AI formats → Scheduled at peak time → Posted ✓
            </p>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!selectedType || selectedPlatforms.length === 0 || (uploadedFiles.length === 0 && !csvFile)}
            >
              Queue for Posting →
            </Button>
          </div>
        </form>
      )}

      {/* TAB: Deeper Analytics */}
      {activeTab === "insights" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-1">Best Times to Post</h2>
            <p className="text-xs text-text-muted">Optimal posting windows by platform, based on audience activity patterns.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <BestTimesCard key={p} platform={p} />
            ))}
          </div>

          <div>
            <h2 className="text-base font-semibold text-text-primary mb-1 mt-2">Platform Metrics</h2>
            <p className="text-xs text-text-muted mb-4">Key performance indicators per platform.</p>
            <div className="grid md:grid-cols-2 gap-5">
              {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
                <MetricsCard key={p} platform={p} />
              ))}
            </div>
          </div>

          <Card>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">📡</span>
              <div>
                <p className="text-sm font-semibold text-text-primary mb-1">How we calculate your best times</p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Autom8 analyzes engagement patterns from your connected platforms — scanning your followers&apos; active hours, content-type performance, and similar audience segments to surface the windows where your posts will reach the most people.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Follower activity heatmap", "Competitor audience overlap", "Hashtag peak windows", "Content-type engagement rates"].map((item) => (
                    <span key={item} className="text-[11px] bg-surface border border-border text-text-muted px-2 py-0.5 rounded-full">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-sm font-semibold text-text-primary mb-1">Ready to post at the perfect time?</p>
            <p className="text-xs text-text-secondary mb-4">Switch to the Schedule tab and upload your content — we&apos;ll auto-select the best window.</p>
            <Button variant="primary" size="md" onClick={() => setActiveTab("upload")}>
              Schedule Content →
            </Button>
          </div>
        </div>
      )}

      {/* TAB: Platform Analytics (internal) */}
      {activeTab === "analytics" && <PlatformAnalytics />}
    </div>
  );
}
