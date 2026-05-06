import Link from "next/link";
import MetricCard from "@/components/ui/MetricCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { mockActivityFeed } from "@/lib/mock-data";

const activityIcon: Record<string, string> = {
  reply: "💬",
  lead: "🔥",
  inbox: "📬",
  escalation: "⚠️",
};

const metrics = [
  { title: "Replies Sent", value: "1,284", change: "+12% this week", changePositive: true },
  { title: "Leads Captured", value: "94", change: "+8 today", changePositive: true },
  { title: "Conversion Rate", value: "7.3%", change: "+1.2%", changePositive: true },
  { title: "Review Queue", value: "4", change: "needs review", changePositive: false },
];

const usagePct = 68;
const usedReplies = 340;
const replyLimit = 500;

export default function DemoDashboardPage() {
  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          Welcome back, Demo 👋
        </h1>
        <p className="text-sm text-text-secondary mt-1">Here&apos;s what&apos;s happening with your Autom8.</p>
      </div>

      {/* Revenue Impact Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_24px_rgba(123,63,242,0.06)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary text-lg">📈</span>
            <p className="text-sm font-bold text-primary">Revenue Opportunity Detected</p>
          </div>
          <p className="text-sm text-text-primary font-medium">
            You&apos;re leaving <span className="text-primary font-bold">~32% of leads</span> unreplied.
          </p>
          <p className="text-xs text-text-secondary mt-1">
            4 comments are waiting in your review queue right now. Every missed comment is a missed lead.
          </p>
        </div>
        <Link href="/demo/inbox">
          <Button variant="primary" size="md" className="shrink-0">Review Now →</Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <MetricCard key={m.title} {...m} highlight={i === 0} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Quick Actions */}
        <Card header={<h2 className="text-base font-semibold text-text-primary">Quick Actions</h2>}>
          <div className="space-y-2.5">
            {[
              { label: "Connect Instagram", desc: "Link your account to start auto-replies", icon: "📱", href: "/demo/settings", cta: "Connect", done: false },
              { label: "Turn On Automation", desc: "Let Autom8 reply while you focus on growth", icon: "⚡", href: "/demo/settings", cta: "Activate", done: false },
              { label: "Edit Brand Voice", desc: "Train the AI to sound exactly like you", icon: "🎨", href: "/demo/settings", cta: "Edit", done: true },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/3 transition-all group">
                  <span className="text-xl shrink-0">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">{action.label}</p>
                    <p className="text-xs text-text-muted truncate">{action.desc}</p>
                  </div>
                  {action.done ? (
                    <span className="text-xs text-success shrink-0">✓ Done</span>
                  ) : (
                    <span className="text-xs text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">{action.cta} →</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card header={<h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>}>
          <div className="space-y-3">
            {mockActivityFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">{activityIcon[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary leading-relaxed">{item.text}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Usage bar */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Reply Usage This Month</p>
            <p className="text-xs text-text-muted mt-0.5">May 1 → May 31</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{usagePct}%</p>
            <p className="text-xs text-text-muted">{usedReplies} / {replyLimit} replies</p>
          </div>
        </div>
        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-brand shadow-[0_0_8px_rgba(123,63,242,0.4)] transition-all duration-700"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </Card>
    </div>
  );
}
