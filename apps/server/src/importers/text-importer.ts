import { ParsedPrompt } from "./json-importer";

export function parseText(text: string): { items: ParsedPrompt[]; errors: string[] } {
  const items: ParsedPrompt[] = [];
  const sections = text.split(/^###\s+/m).filter((s) => s.trim());
  if (sections.length > 1) {
    for (const section of sections) {
      const lines = section.split("\n");
      const title = lines[0].trim();
      const content = lines.slice(1).join("\n").trim();
      if (title && content) items.push({ title, content });
    }
  } else {
    const paragraphs = text.split(/\n\s*\n/).filter((s) => s.trim());
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      const firstLine = p.split("\n")[0].trim();
      items.push({ title: firstLine.substring(0, 50) || `Prompt ${i + 1}`, content: p });
    }
  }
  return { items, errors: [] };
}
