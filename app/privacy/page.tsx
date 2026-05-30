import Link from "next/link";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg px-6 py-12 max-w-3xl mx-auto">
      <Link href="/" className="text-primary text-sm hover:underline">← Back to Home</Link>
      <div className="mt-8">
        <PrivacyPolicyContent />
      </div>
    </div>
  );
}
