"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/callback?next=/reset-password",
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">autom8</Link>
          <p className="text-white/40 text-sm mt-2">Reset your password</p>
        </div>

        <div className="bg-surface border border-white/5 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✉</div>
              <h3 className="font-semibold mb-2">Check your inbox</h3>
              <p className="text-white/50 text-sm mb-5">
                We sent a reset link to <strong className="text-white">{email}</strong>
              </p>
              <Link href="/login" className="text-primary text-sm hover:underline">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-white/50 text-sm mb-5">
                Enter your email and we&apos;ll send you a password reset link.
              </p>
              {error && (
                <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Send Reset Link
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors">
                  ← Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
