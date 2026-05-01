"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">autom8</Link>
          <p className="text-white/40 text-sm mt-2">Set a new password</p>
        </div>

        <div className="bg-surface border border-white/5 rounded-2xl p-8">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="font-semibold mb-2">Password updated</h3>
              <p className="text-white/50 text-sm mb-5">You can now sign in with your new password.</p>
              <Link href="/login" className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <Input label="New Password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Input label="Confirm Password" type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                Update Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
