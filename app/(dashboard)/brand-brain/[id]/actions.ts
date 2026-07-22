"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import type { CtaLink, Faq } from "@/lib/brand-brain";
import type { BrandBrain } from "@/lib/supabase/types";

export type FormState = { error: string } | { ok: true } | null;

function parseCtaLinks(v: FormDataEntryValue | null): CtaLink[] {
  // One per line: "Label | https://url"
  return String(v ?? "")
    .split("\n")
    .map((line) => {
      const [label, url] = line.split("|").map((s) => s.trim());
      return label && url ? { label, url } : null;
    })
    .filter((x): x is CtaLink => x !== null);
}

function parseFaqs(form: FormData): Faq[] {
  const faqs: Faq[] = [];
  for (let i = 1; i <= 3; i += 1) {
    const q = String(form.get(`faq_q_${i}`) ?? "").trim();
    const a = String(form.get(`faq_a_${i}`) ?? "").trim();
    if (q && a) faqs.push({ q, a });
  }
  return faqs;
}

function parseList(v: FormDataEntryValue | null): string[] {
  return String(v ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFormality(v: FormDataEntryValue | null) {
  const value = Number(v ?? 50);
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isMissingOffersColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "PGRST204" ||
        error.message?.includes("schema cache")) &&
      error.message?.includes("'offers'"),
  );
}

export async function saveBrandBrainAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, supabase } = await requireUser();
  const agentId = String(formData.get("agent_id") ?? "");
  if (!agentId) return { error: "Missing agent." };

  // Ownership check (RLS also enforces).
  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id")
    .eq("id", agentId)
    .maybeSingle();
  if (!agent) return { error: "Agent not found." };

  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const tones = formData
    .getAll("tone")
    .map((item) => String(item).trim())
    .filter(Boolean);
  const { data: existingBrain } = await supabase
    .from("marketing_os_brand_brains")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();
  const brain = existingBrain as BrandBrain | null;

  const brainPayload = {
    agent_id: agentId,
    owner_id: user.id,
    business_name: str("business_name"),
    industry: str("industry"),
    description: str("description"),
    language: str("language") ?? "English",
    tone: tones.length ? tones : (brain?.tone ?? []),
    tone_notes: str("tone_notes"),
    offers: str("offers"),
    services_products: str("services_products"),
    pricing: str("pricing"),
    brand_voice_examples: str("brand_voice_examples"),
    web_link: str("web_link"),
    booking_link: str("booking_link"),
    allowed_ctas: str("allowed_ctas"),
    cta_keywords: parseList(formData.get("cta_keywords")),
    cta_links: parseCtaLinks(formData.get("cta_links")) as unknown as never,
    faqs: parseFaqs(formData) as unknown as never,
    emoji_allowed: formData.get("emoji_allowed") === "on",
    formality_level: parseFormality(formData.get("formality_level")),
    location: str("location"),
    hours: str("hours"),
    phone: str("phone"),
  };

  const { error } = await supabase
    .from("marketing_os_brand_brains")
    .upsert(brainPayload, { onConflict: "agent_id" });
  if (isMissingOffersColumn(error)) {
    const { offers: _offers, ...payloadWithoutOffers } = brainPayload;
    void _offers;
    const { error: fallbackError } = await supabase
      .from("marketing_os_brand_brains")
      .upsert(payloadWithoutOffers, { onConflict: "agent_id" });
    if (fallbackError) return { error: fallbackError.message };
  } else if (error) {
    return { error: error.message };
  }

  revalidatePath(`/brand-brain/${agentId}`);
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/clients");
  return { ok: true };
}
