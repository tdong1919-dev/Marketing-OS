import type { BrandBrain } from "@/lib/supabase/types";

export interface CtaLink {
  label: string;
  url: string;
}
export interface Faq {
  q: string;
  a: string;
}

export function ctaLinksOf(b: Pick<BrandBrain, "cta_links">): CtaLink[] {
  return Array.isArray(b.cta_links) ? (b.cta_links as unknown as CtaLink[]) : [];
}
export function faqsOf(b: Pick<BrandBrain, "faqs">): Faq[] {
  return Array.isArray(b.faqs) ? (b.faqs as unknown as Faq[]) : [];
}

/**
 * Format agent business facts into a compact, prompt-ready brief that augments
 * the auto-extracted Voice DNA / Knowledge Graph during content generation.
 */
export function buildBrandBrainBrief(b: BrandBrain | null): string {
  if (!b) return "";
  const lines: string[] = [];

  if (b.business_name)
    lines.push(`Business: ${b.business_name}${b.industry ? ` (${b.industry})` : ""}`);
  if (b.description) lines.push(`About: ${b.description}`);
  if (b.tone.length)
    lines.push(`Tone: ${b.tone.join(", ")}${b.tone_notes ? ` — ${b.tone_notes}` : ""}`);
  if (b.offers) lines.push(`Offers: ${b.offers}`);
  if (b.services_products) lines.push(`Services / products: ${b.services_products}`);
  if (b.pricing) lines.push(`Pricing: ${b.pricing}`);
  if (b.allowed_ctas) lines.push(`Allowed CTAs: ${b.allowed_ctas}`);

  const links = ctaLinksOf(b);
  if (links.length)
    lines.push(`CTA links: ${links.map((l) => `${l.label} → ${l.url}`).join(", ")}`);
  if (b.booking_link) lines.push(`Booking link: ${b.booking_link}`);
  if (b.web_link) lines.push(`Website: ${b.web_link}`);

  const faqs = faqsOf(b);
  if (faqs.length)
    lines.push(`FAQs: ${faqs.map((f) => `Q: ${f.q} A: ${f.a}`).join(" | ")}`);
  if (b.brand_voice_examples)
    lines.push(`Brand voice examples: ${b.brand_voice_examples}`);

  lines.push(
    `Emoji: ${b.emoji_allowed ? "allowed" : "avoid"}. Formality: ${b.formality_level}/100.`,
  );
  if (b.language && b.language !== "English") lines.push(`Language: ${b.language}`);

  return lines.length ? `AGENT BUSINESS FACTS:\n${lines.join("\n")}` : "";
}
