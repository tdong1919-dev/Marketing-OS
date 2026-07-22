import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Revision Learning · Jidoka Marketing Team OS" };

export default function RevisionsPage() {
  return (
    <div>
      <PageHeader
        title="Revision Learning"
        description="Every human edit makes the agent better."
      />
      <ComingSoon
        title="Revision Learning Engine"
        description="Track original AI output vs. human-edited vs. published versions to build correction memory over time."
        bullets={[
          "Diff added/removed words, hooks, CTAs, tone",
          "Learn what gets approved vs. rejected",
          "Feed corrections back into future generations",
        ]}
      />
    </div>
  );
}
