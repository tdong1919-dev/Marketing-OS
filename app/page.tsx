import Link from "next/link";
import { mockPlans } from "@/lib/mock-data";

const features = [
  {
    icon: "⚡",
    title: "Auto Replies",
    desc: "AI reads every comment and crafts an on-brand reply in seconds. Never miss an opportunity.",
  },
  {
    icon: "◈",
    title: "Brand Voice Control",
    desc: "Set your tone, keywords, services, and escalation rules. The AI replies exactly like you.",
  },
  {
    icon: "✓",
    title: "Human Review Queue",
    desc: "Every reply waits for your approval. Edit, approve, or reject before anything goes live.",
  },
];

const audiences = ["Creators", "Coaches", "Agencies", "Medspas", "Beauty Brands", "Small Businesses"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xl font-bold text-brand-purple">autom8</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Log in</Link>
          <Link href="/signup" className="bg-brand-purple text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/20 rounded-full px-4 py-1.5 text-xs text-brand-purple mb-8">
          ✦ AI-Powered Instagram Reply Automation
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Automate Your<br />
          <span className="text-brand-purple">Instagram Replies</span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Autom8 replies to every comment with your brand voice — automatically. You review, approve, and post. Convert followers into customers while you sleep.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="bg-brand-purple text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-base w-full sm:w-auto">
            Start Free Trial →
          </Link>
          <Link href="/dashboard" className="border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium px-8 py-3.5 rounded-xl transition-all text-base w-full sm:w-auto">
            See Demo Dashboard
          </Link>
        </div>
        <p className="text-sm text-white/30 mt-4">No credit card required · 14-day free trial</p>
      </section>

      {/* Audience tags */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <p className="text-center text-white/40 text-sm mb-5">Built for</p>
        <div className="flex flex-wrap justify-center gap-3">
          {audiences.map((a) => (
            <span key={a} className="border border-white/10 text-white/60 text-sm px-4 py-1.5 rounded-full">
              {a}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold text-center mb-14">
          Everything you need to{" "}
          <span className="text-neon">convert comments</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-surface border border-white/5 rounded-xl p-6 hover:border-brand-purple/30 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
        <p className="text-white/50 text-center mb-14">Start free. Upgrade when you grow.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {mockPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface rounded-xl p-6 flex flex-col border transition-all
                ${plan.popular
                  ? "border-brand-purple shadow-lg shadow-brand-purple/10 relative"
                  : "border-white/5"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-5">
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-white/40 text-sm pb-1">/{plan.period}</span>
                </div>
                <p className="text-white/40 text-xs mt-1">{plan.replyLimit.toLocaleString()} replies/mo</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-neon mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90
                  ${plan.popular ? "bg-brand-purple text-white" : "border border-white/20 text-white/70 hover:text-white"}`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-brand-purple font-bold">autom8</span>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Autom8. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
