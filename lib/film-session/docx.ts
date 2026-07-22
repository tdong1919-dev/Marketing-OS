import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

import { cleanBullet, type AssembledSection } from "@/lib/film-session/assemble";

/**
 * Build a .docx that mirrors the "Film Session" reference layout:
 * title, emoji section headers, 🎬 script blocks with TL;DR, numbered/labeled
 * lines, and indented sub-bullets (riff prompts / fill-ins).
 */
export async function buildFilmSessionDocx(
  sessionTitle: string,
  clientName: string | null,
  sections: AssembledSection[],
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: sessionTitle, bold: true })],
    }),
  );
  if (clientName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: clientName, italics: true, color: "666666" })],
        spacing: { after: 200 },
      }),
    );
  }

  for (const sec of sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 120 },
        children: [new TextRun({ text: `${sec.emoji} ${sec.section}`, bold: true })],
      }),
    );

    for (const s of sec.scripts) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 60 },
          children: [new TextRun({ text: `🎬 ${s.title}`, bold: true, size: 26 })],
        }),
      );

      if (s.tldr && s.tldr.length) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "TL;DR", bold: true, italics: true })],
          }),
        );
        for (const b of s.tldr) {
          children.push(new Paragraph({ text: cleanBullet(b), bullet: { level: 0 } }));
        }
      }

      for (const blk of s.blocks) {
        const label = (blk.label ?? "").trim();
        const line = label ? `${label} ${blk.text}` : blk.text;
        children.push(new Paragraph({ text: line, spacing: { before: 40 } }));
        for (const sub of blk.bullets ?? []) {
          children.push(new Paragraph({ text: cleanBullet(sub), bullet: { level: 0 } }));
        }
      }
    }
  }

  const doc = new Document({
    creator: "Jidoka Marketing Team OS",
    title: sessionTitle,
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
