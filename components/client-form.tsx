"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { readJsonResponse } from "@/lib/client-response";

export function ClientForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/clients/create", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const json = await readJsonResponse<{
        id?: string;
        error?: string;
      }>(res);
      if (!res.ok || !json.id) {
        throw new Error(json.error ?? "Could not create client.");
      }
      router.push(`/clients/${json.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create client.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Client name *</Label>
        <Input id="name" name="name" required placeholder="Acme Coaching" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input id="industry" name="industry" placeholder="Business coaching" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Anything useful about this client…"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create client"}
      </Button>
    </form>
  );
}
