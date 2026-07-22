import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Performance Intelligence · Jidoka Marketing Team OS" };

export default function PerformancePage() {
  return (
    <div>
      <PageHeader
        title="Performance Intelligence"
        description="Learn what actually performs across the creator's channels."
      />
      <ComingSoon
        title="Performance Intelligence Engine"
        description="Connect Instagram, YouTube, LinkedIn, Facebook, X, and email to surface top hooks, CTAs, formats, and emotional arcs. TikTok is paused while API setup is in progress."
        bullets={[
          "Top 10% / middle 50% / bottom 10% content tiers",
          "Best hooks, CTAs, and storytelling structures",
          "Recommendations that update as new data arrives",
        ]}
      />
    </div>
  );
}
