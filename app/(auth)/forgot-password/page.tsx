"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset, type ResetState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    requestPasswordReset,
    null,
  );
  const sent = state && "sent" in state;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          {sent
            ? "If an account exists for that email, a reset link is on its way."
            : "Enter your email and we'll send you a reset link."}
        </CardDescription>
      </CardHeader>
      {sent ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Check your inbox and follow the link to choose a new password. It may
            take a minute to arrive.
          </p>
        </CardContent>
      ) : (
        <form action={action}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@agency.com"
              />
            </div>
            {state && "error" in state && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
          </CardContent>
          <CardFooter className="mt-4 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </CardFooter>
        </form>
      )}
      <CardContent className="pt-0">
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
