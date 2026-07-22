/**
 * Script Format Registry.
 *
 * Codifies the Jidoka Marketing Team OS filming-script formats — the structural rules that make
 * each script type distinct — derived from the client's Drive format library and
 * the "Film Session" reference layout. Each script the generator produces uses a
 * generic block model that can represent every format's internal structure, and
 * the format's `rules` tell the writer how to populate it.
 */

/** A single structured line/beat of a script. */
export interface ScriptBlock {
  /** Prefix label, e.g. "1.", "POINT 1: …", "Don't Say →", "HOOK:". */
  label?: string;
  /** Main line of the beat. */
  text: string;
  /** Sub-bullets: riff prompts, examples, fill-ins, or supporting points. */
  bullets?: string[];
}

/** One generated script in a given format. */
export interface ScriptDraft {
  formatId: string;
  title: string;
  /** Optional TL;DR bullets (used by Articles etc.). */
  tldr?: string[];
  blocks: ScriptBlock[];
}

export interface ScriptFormat {
  id: string;
  name: string;
  /** Drive format family this belongs to. */
  family: string;
  /** Film-Session section this script files under. */
  section: string;
  sectionEmoji: string;
  /** Relative order of the section in the assembled session. */
  sectionOrder: number;
  /** Whether scripts in this format carry a TL;DR block. */
  usesTldr: boolean;
  /** One-line human description. */
  description: string;
  /** Directive rules the writer follows to structure a script in this format. */
  rules: string;
}

export const SCRIPT_FORMATS: ScriptFormat[] = [
  {
    id: "talk-to-camera",
    name: "Talk-To-Camera",
    family: "Talk-To-Camera",
    section: "TOFU — Talk To Camera",
    sectionEmoji: "🔝",
    sectionOrder: 1,
    usesTldr: false,
    description: "Direct-address value drop, single take.",
    rules:
      "Single-take direct address. Block 1 is a scroll-stopping HOOK line. Then 3–5 numbered value beats that teach one idea each, in the creator's voice and beliefs. End with one line that lands the point or a soft CTA. Where the creator would riff, add a sub-bullet prompt like '● Riff on ___' rather than over-scripting.",
  },
  {
    id: "articles-reaction",
    name: "Article Reaction",
    family: "Reactions",
    section: "Articles",
    sectionEmoji: "🗞",
    sectionOrder: 2,
    usesTldr: true,
    description: "React to an industry article with scripted lines + riff prompts.",
    rules:
      "Provide a 3–6 bullet TL;DR summarizing the article's key claims/stats. Then EXACTLY 5 numbered blocks: (1) the headline/hook restated punchily; (2) a provocative framing question (e.g. 'but is that a good thing?'); (3) 'This article states that ___' with the key stat/claim; (4) a riff prompt as text 'My honest thoughts on this are ___' with a sub-bullet '● Give your honest thoughts using info from this article & our meeting'; (5) a punchy closing take, often a fill-in like 'If a clinic isn't doing X, they should feel ___'. Keep talent fill-ins as blanks; do not answer them.",
  },
  {
    id: "yes-no-maybe",
    name: "Yes, No, or Maybe",
    family: "This or That",
    section: "TOFU — Yes / No / Maybe",
    sectionEmoji: "🔝",
    sectionOrder: 3,
    usesTldr: false,
    description: "Debatable statements the talent reacts to on camera.",
    rules:
      "Title as 'Yes, No, Or Maybe: {Topic}'. Produce 8–10 numbered blocks, each a provocative, genuinely debatable statement about the topic (mix obviously-true, obviously-false, and 'it depends' ones). Under EACH statement add two sub-bullets exactly: '○ Give your answer' and '○ 1-2 short sentences on why (if needed)'. Do NOT answer them — these are talent prompts.",
  },
  {
    id: "do-dont",
    name: "Do / Don't Say",
    family: "Talk-To-Camera",
    section: "Do / Don't",
    sectionEmoji: "✅",
    sectionOrder: 4,
    usesTldr: false,
    description: "Reframe jargon into plain, benefit-led selling language.",
    rules:
      "Title as 'Do / Don't Say: Selling {Product/Service}'. Produce 4–6 PAIRS. For each pair, output two blocks in order: one labeled 'Don't Say →' with the technical/jargon/clinical phrasing, then one labeled 'Do Say →' with the plain, outcome-led, patient-friendly version of the SAME point. Keep each line short and spoken.",
  },
  {
    id: "tracking-kpi",
    name: "How To Track (KPI)",
    family: "Talk-To-Camera",
    section: "Tracking KPIs",
    sectionEmoji: "🔍",
    sectionOrder: 5,
    usesTldr: false,
    description: "Whiteboard-style KPI explainer with speaker fill-ins.",
    rules:
      "Title as 'How to Track {KPI}'. Produce EXACTLY 7 numbered blocks: (1) the KPI name; (2) \"First, what does '{KPI}' actually mean?\"; (3) a one-sentence plain definition; (4) 'So how do you track it?'; (5)–(7) three placeholders exactly '[Speaker fills in: Action step #N on tracking {KPI}]'. These are whiteboard reveal steps.",
  },
  {
    id: "objection-handling",
    name: "Handling Objections",
    family: "Talk-To-Camera",
    section: "Whiteboard: Objections",
    sectionEmoji: "🛑",
    sectionOrder: 6,
    usesTldr: false,
    description: "Whiteboard objection breakdown, fully written.",
    rules:
      "Title as 'Handling {Audience} Objection: {Objection}'. Fully written (no blanks). Numbered structure: (1) restate the objection title; (2) \"First, what does '{objection}' actually mean?\"; (3) a one-sentence reframe of what it really signals; (4) 'So what do you do?' then lettered sub-steps a/b/c — each a tactic as a block with 1–3 supporting bullets, including example spoken lines in quotes; (5) a final line 'Then, if that doesn't work, {consequence / let them go}.'",
  },
  {
    id: "harmful-things",
    name: "Harmful Things / Mistakes",
    family: "Harmful Things List",
    section: "Harmful Things",
    sectionEmoji: "😅",
    sectionOrder: 7,
    usesTldr: false,
    description: "'N mistakes' listicle with hook + 3 points, fully written.",
    rules:
      "Title as '{N} {Thing} Mistakes {Consequence}' (N is usually 3). First block labeled 'HOOK:' with a scroll-stopping line, e.g. '{N} mistakes turning your {device/plan} into {bad outcome} — and number {X} is the worst.' Then POINT 1/2/3 blocks, each labeled 'POINT N: {mistake stated as a claim}', with 3–4 bullets that: name the mistake, explain why it costs them, cite a concrete stat/number if available, and give the fix. Fully written, punchy, in the creator's voice.",
  },
  {
    id: "hot-take",
    name: "Hot Take",
    family: "Hot Take",
    section: "Hot Takes",
    sectionEmoji: "🔥",
    sectionOrder: 8,
    usesTldr: false,
    description: "Bold contrarian opinion stated and defended.",
    rules:
      "Block 1: the hot take stated flatly and confidently as a HOOK. Blocks 2–4: the reasoning and evidence for it, drawing on the creator's actual contrarian beliefs. Final block: a mic-drop restatement. Take a real stance — never hedge.",
  },
  {
    id: "ranking",
    name: "Ranking / X Things That",
    family: "Ranking",
    section: "Rankings",
    sectionEmoji: "🏆",
    sectionOrder: 9,
    usesTldr: false,
    description: "Counted/ranked list with a hook.",
    rules:
      "Title as '{N} {Things} That {Criteria}'. Block 1 is a HOOK naming the count and stakes. Then N blocks labeled '{n}.' each with the item as `text` and 1–2 supporting bullets. If it's a ranking, count DOWN to #1 and make #1 the strongest.",
  },
  {
    id: "this-or-that",
    name: "This or That",
    family: "This or That",
    section: "This or That",
    sectionEmoji: "⚖️",
    sectionOrder: 10,
    usesTldr: false,
    description: "Head-to-head comparison with a verdict.",
    rules:
      "Title as '{A} vs {B}'. Block 1 poses the choice as a HOOK. Then 3–5 comparison blocks, one per dimension (each labeled with the dimension), declaring a winner for that dimension in one line. Final block: the overall verdict and who it's right for.",
  },
  {
    id: "before-after",
    name: "Before & After",
    family: "Before & After Concepts",
    section: "Before & After",
    sectionEmoji: "🔁",
    sectionOrder: 11,
    usesTldr: false,
    description: "Pain-state to outcome-state contrast.",
    rules:
      "Block 1 HOOK naming the transformation. A block labeled 'Before:' with 2–3 bullets of the painful current state. A block labeled 'After:' with 2–3 bullets of the desired outcome. A bridge block explaining how you get from one to the other. Close with a CTA line.",
  },
  {
    id: "visual-metaphor",
    name: "Visual Metaphor",
    family: "Visual Metaphors",
    section: "Visual Metaphors",
    sectionEmoji: "🎨",
    sectionOrder: 12,
    usesTldr: false,
    description: "Explain a concept through one concrete visual metaphor.",
    rules:
      "Block 1 HOOK introducing the metaphor ('Running a clinic is like ___'). Blocks 2–4 extend the metaphor to teach the real point, one mapping per beat. Add a sub-bullet '● On screen: ___' suggesting the visual for each beat. Final block ties the metaphor back to the action the viewer should take.",
  },
];

export const SECTIONS_IN_ORDER = [...SCRIPT_FORMATS]
  .sort((a, b) => a.sectionOrder - b.sectionOrder)
  .reduce<{ order: number; section: string; emoji: string }[]>((acc, f) => {
    if (!acc.some((s) => s.section === f.section)) {
      acc.push({ order: f.sectionOrder, section: f.section, emoji: f.sectionEmoji });
    }
    return acc;
  }, []);

export function getFormat(id: string): ScriptFormat | undefined {
  return SCRIPT_FORMATS.find((f) => f.id === id);
}
