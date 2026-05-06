"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";

const platforms = [
  { name: "Instagram", icon: "📸", status: "live", desc: "Comments, DMs & Stories" },
  { name: "Facebook", icon: "📘", status: "live", desc: "Comments & Messenger" },
  { name: "TikTok", icon: "🎵", status: "soon", desc: "Comments & DM replies" },
  { name: "YouTube", icon: "▶️", status: "soon", desc: "Comment management" },
  { name: "Google Business", icon: "🗺️", status: "soon", desc: "Review responses" },
  { name: "X / Twitter", icon: "𝕏", status: "soon", desc: "Mentions & replies" },
  { name: "LinkedIn", icon: "💼", status: "soon", desc: "Comments & messages" },
  { name: "Pinterest", icon: "📌", status: "soon", desc: "Pin comments" },
  { name: "Threads", icon: "🧵", status: "soon", desc: "Replies & mentions" },
];

const features = [
  { icon: "📅", title: "Smart Scheduling", desc: "Post at peak times automatically — no more guessing when your audience is online." },
  { icon: "📦", title: "Bulk Upload", desc: "Drop a CSV or connect Google Drive. Schedule a month of content in minutes." },
  { icon: "🎬", title: "Reels & Stories", desc: "Full support for short-form video, carousels, and Stories across every platform." },
  { icon: "🔁", title: "Auto-Recycling", desc: "Re-surface your best content automatically to keep your feed fresh without extra work." },
];

export default function SchedulerPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-8">

      {/* Hero */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-7 md:p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Coming Soon
          </span>
          <div className="text-5xl mb-4">📅</div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 tracking-tight">
            Smart Scheduler
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
            Post at the perfect time. Schedule Reels, carousels, Stories and more across every platform — automatically, while Autom8 handles your replies.
          </p>
        </div>
      </div>

      {/* What's coming */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">What&apos;s included</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary/20 transition-colors">
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-text-primary mb-1">{f.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Platforms</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {platforms.map((p) => (
            <div
              key={p.name}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors
                ${p.status === "live"
                  ? "border-primary/25 bg-primary/5"
                  : "border-border bg-surface opacity-70"
                }`}
            >
              <span className="text-xl shrink-0">{p.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                  {p.status === "live" ? (
                    <span className="shrink-0 text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">LIVE</span>
                  ) : (
                    <span className="shrink-0 text-[9px] font-bold bg-border text-text-muted px-1.5 py-0.5 rounded-full">SOON</span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted truncate">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waitlist CTA */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8 shadow-[0_0_32px_rgba(123,63,242,0.05)]">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Be first in line</p>
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2 leading-snug">
            The biggest library of AI tools & automation systems — with live human support.
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Scheduler is just the start. Join the waitlist and get early access before anyone else.
          </p>

          {submitted ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">🎉</span>
              <p className="text-sm font-semibold text-primary">You&apos;re on the list!</p>
              <p className="text-xs text-text-muted">We&apos;ll email you the moment it&apos;s ready.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbrand.com"
                required
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-primary/40 transition-colors"
              />
              <Button type="submit" variant="primary" size="md">
                Join waitlist →
              </Button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
