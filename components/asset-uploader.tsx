"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Link2, ClipboardPaste, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readJsonResponse } from "@/lib/client-response";

const KINDS = [
  "script",
  "caption",
  "post",
  "email",
  "transcript",
  "vsl",
  "ad",
  "other",
];
const MAX_ASSET_UPLOAD_BYTES = 4 * 1024 * 1024;

export function AssetUploader({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const busy = pending || submitting;

  /** POST one asset; returns an error message or null on success. */
  async function postOne(form: FormData): Promise<string | null> {
    form.set("agent_id", agentId);
    try {
      const res = await fetch("/api/assets/upload", { method: "POST", body: form });
      const json = await readJsonResponse(res);
      return res.ok ? null : (json.error ?? "Upload failed");
    } catch {
      return "Network error";
    }
  }

  async function onFileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fileInput = formEl.elements.namedItem("file") as HTMLInputElement;
    const files = Array.from(fileInput.files ?? []);
    if (files.length === 0) {
      toast.error("Choose at least one file");
      return;
    }
    const tooLarge = files.find((file) => file.size > MAX_ASSET_UPLOAD_BYTES);
    if (tooLarge) {
      toast.error(`${tooLarge.name} is too large. Keep uploads under 4 MB for now.`);
      return;
    }
    const kind = (formEl.elements.namedItem("kind") as HTMLSelectElement).value;

    setSubmitting(true);
    let ok = 0;
    const errors: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", kind);
      const err = await postOne(fd);
      if (err) errors.push(`${file.name}: ${err}`);
      else ok += 1;
    }
    setSubmitting(false);

    if (ok > 0) toast.success(`Added ${ok} asset${ok === 1 ? "" : "s"}`);
    if (errors.length) toast.error(errors.slice(0, 3).join(" · "));
    if (ok > 0) {
      formEl.reset();
      startTransition(() => router.refresh());
    }
  }

  async function onTextSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    if (!String(form.get("text") ?? "").trim()) {
      toast.error("Paste some text first");
      return;
    }
    setSubmitting(true);
    const err = await postOne(form);
    setSubmitting(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("Asset added");
    el.reset();
    startTransition(() => router.refresh());
  }

  async function onUrlSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    form.set("kind", "url");
    if (!String(form.get("source_url") ?? "").trim()) {
      toast.error("Enter a URL first");
      return;
    }
    setSubmitting(true);
    const err = await postOne(form);
    setSubmitting(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("Asset added");
    el.reset();
    startTransition(() => router.refresh());
  }

  return (
    <Tabs defaultValue="file" className="rounded-lg border p-4">
      <TabsList>
        <TabsTrigger value="file">
          <Upload className="mr-1 h-4 w-4" /> File
        </TabsTrigger>
        <TabsTrigger value="paste">
          <ClipboardPaste className="mr-1 h-4 w-4" /> Paste
        </TabsTrigger>
        <TabsTrigger value="url">
          <Link2 className="mr-1 h-4 w-4" /> URL
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file" className="mt-4">
        <form onSubmit={onFileSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="file">PDF, DOCX, TXT, CSV, or Markdown — select one or many</Label>
            <Input
              id="file"
              name="file"
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.csv,.md,.html"
            />
          </div>
          <KindSelect />
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {busy ? "Uploading…" : "Upload & extract"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="paste" className="mt-4">
        <form onSubmit={onTextSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" name="title" placeholder="e.g. Webinar VSL" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Content</Label>
            <Textarea
              id="text"
              name="text"
              rows={8}
              placeholder="Paste a script, caption, email, or transcript…"
            />
          </div>
          <KindSelect />
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {busy ? "Saving…" : "Add text"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="url" className="mt-4">
        <form onSubmit={onUrlSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="source_url">Page URL</Label>
            <Input
              id="source_url"
              name="source_url"
              type="url"
              placeholder="https://example.com/article"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {busy ? "Fetching…" : "Fetch & extract"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function KindSelect() {
  return (
    <div className="space-y-2">
      <Label htmlFor="kind">Asset type</Label>
      <select
        id="kind"
        name="kind"
        defaultValue="script"
        className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
    </div>
  );
}
