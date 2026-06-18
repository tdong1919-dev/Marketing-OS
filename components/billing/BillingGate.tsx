"use client";
import { useEffect, useState } from "react";

// Statuses that mean "payment needed" — a lapsed free trial lands here.
const BLOCKING = ["past_due", "unpaid", "incomplete"];

/**
 * Watches the user's subscription status and, when a trial/plan has lapsed,
 * shows a blocking prompt that redirects to Stripe to add a card. Renders
 * nothing in the normal case.
 */
export default function BillingGate() {
  const [blocked, setBlocked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((j) => { if (active && BLOCKING.includes(j.status)) setBlocked(true); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!blocked) return null;

  const addCard = async () => {
    setRedirecting(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else setRedirecting(false);
    } catch {
      setRedirecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-7 text-center">
        <div className="text-4xl mb-3">⏰</div>
        <h2 className="text-lg font-bold text-text-primary mb-1">Your free month has ended</h2>
        <p className="text-sm text-text-secondary mb-6">
          Add a payment method to keep your Autom8 access. You won&apos;t lose any of your setup.
        </p>
        <button
          onClick={addCard}
          disabled={redirecting}
          className="w-full text-sm font-semibold text-white bg-gradient-to-r from-accent-pink to-accent-purple rounded-lg px-5 py-3 disabled:opacity-60"
        >
          {redirecting ? "Redirecting to Stripe…" : "Add a card & continue →"}
        </button>
        <p className="text-[11px] text-text-muted mt-3">Secure checkout powered by Stripe.</p>
      </div>
    </div>
  );
}
