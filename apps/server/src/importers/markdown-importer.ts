import { ParsedPrompt } from "./json-importer";

export function parseMarkdown(text: string): { items: ParsedPrompt[]; errors: string[] } {
  const errors: string[] = [];
  const items: ParsedPrompt[] = [];
  const sections = text.split(/^---$/m).filter((s) => s.trim());
  if (sections.length === 0) {
    const h1Sections = text.split(/^# /m).filter((s) => s.trim());
    for (const section of h1Sections) {
      const lines = section.split("\n");
      const title = lines[0].replace(/^#+\s*/, "").trim();
      const content = lines.slice(1).join("\n").trim();
      if (title && content) items.push({ title, content });
    }
  } else {
    for (const section of sections) {
      const lines = section.split("\n");
      const title = lines[0].replace(/^#+\s*/, "").trim() || "Untitled";
      const content = lines.slice(1).join("\n").trim();
      if (content) items.push({ title, content });
    }
  }
  if (items.length === 0 && text.trim()) items.push({ title: "Imported Markdown", content: text.trim() });
  return { items, errors };
}
