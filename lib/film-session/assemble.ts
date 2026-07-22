import { getFormat } from "@/lib/formats/registry";
import type { GeneratedFilmScript } from "@/lib/ai/film-session";

export interface AssembledScript extends GeneratedFilmScript {
  formatName: string;
  /** Position in the session's original scripts[] array (for scheduling). */
  index: number;
}

export interface AssembledSection {
  emoji: string;
  section: string;
  order: number;
  scripts: AssembledScript[];
}

/** Group generated scripts into Film-Session sections, ordered like the reference. */
export function assembleSession(
  scripts: GeneratedFilmScript[],
): AssembledSection[] {
  const map = new Map<string, AssembledSection>();
  scripts.forEach((s, index) => {
    const fmt = getFormat(s.formatId);
    if (!fmt) return;
    if (!map.has(fmt.section)) {
      map.set(fmt.section, {
        emoji: fmt.sectionEmoji,
        section: fmt.section,
        order: fmt.sectionOrder,
        scripts: [],
      });
    }
    map.get(fmt.section)!.scripts.push({ ...s, formatName: fmt.name, index });
  });
  return [...map.values()].sort((a, b) => a.order - b.order);
}

/** Total script count across sections. */
export function countScripts(sections: AssembledSection[]): number {
  return sections.reduce((n, s) => n + s.scripts.length, 0);
}

/**
 * Strip a leading bullet glyph the model sometimes emits inside a sub-bullet
 * ("● Riff on …", "○ Give your answer"). The view and .docx add their own list
 * markers, so keeping the glyph in the text produces a double bullet.
 */
export function cleanBullet(text: string): string {
  return text.replace(/^[\s]*[•●○◦‣·*\-–—]+\s*/u, "").trim();
}

/** Flatten a single script into a readable plain-text block (for storage + captions). */
export function scriptToPlainText(script: GeneratedFilmScript): string {
  const lines: string[] = [script.title];
  if (script.tldr?.length) {
    lines.push(`TL;DR: ${script.tldr.map(cleanBullet).join(" • ")}`);
  }
  for (const b of script.blocks) {
    const label = (b.label ?? "").trim();
    lines.push(label ? `${label} ${b.text}` : b.text);
    for (const sub of b.bullets ?? []) {
      lines.push(`  - ${cleanBullet(sub)}`);
    }
  }
  return lines.join("\n");
}
