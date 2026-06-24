import { ParsedPrompt } from "./json-importer";

export function parseCsv(text: string): { items: ParsedPrompt[]; errors: string[] } {
  const errors: string[] = [];
  const items: ParsedPrompt[] = [];
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) { errors.push("CSV must have a header row and at least one data row"); return { items, errors }; }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const titleIdx = headers.findIndex((h) => ["title", "name", "act"].includes(h));
  const contentIdx = headers.findIndex((h) => ["content", "prompt", "body"].includes(h));
  const descIdx = headers.findIndex((h) => h === "description");
  const catIdx = headers.findIndex((h) => h === "category");
  const tagsIdx = headers.findIndex((h) => h === "tags");

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const title = titleIdx >= 0 ? values[titleIdx] : values[0] || "";
    const content = contentIdx >= 0 ? values[contentIdx] : values[1] || "";
    if (title && content) {
      items.push({
        title,
        content,
        description: descIdx >= 0 ? values[descIdx] : "",
        category: catIdx >= 0 ? values[catIdx] : "",
        tags: tagsIdx >= 0 ? values[tagsIdx].split(";").map((t) => t.trim()).filter(Boolean) : [],
      });
    }
  }
  return { items, errors };
}
