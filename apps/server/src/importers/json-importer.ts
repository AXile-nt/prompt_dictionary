export interface ParsedPrompt { title: string; content: string; description?: string; tags?: string[]; category?: string; }

export function parseJson(text: string): { items: ParsedPrompt[]; errors: string[] } {
  const errors: string[] = [];
  const items: ParsedPrompt[] = [];
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      for (const item of data) { items.push(normalizeItem(item)); }
    } else if (typeof data === "object") { items.push(normalizeItem(data)); }
    else { errors.push("JSON must be an array or object"); }
  } catch (e) { errors.push(`Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`); }
  return { items, errors };
}

function normalizeItem(item: Record<string, unknown>): ParsedPrompt {
  return {
    title: (typeof item.title === "string" && item.title) || (typeof item.name === "string" && item.name) || (typeof item.act === "string" && item.act) || "Untitled",
    content: (typeof item.content === "string" && item.content) || (typeof item.prompt === "string" && item.prompt) || (typeof item.body === "string" && item.body) || "",
    description: typeof item.description === "string" ? item.description : "",
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : typeof item.tags === "string" ? (item.tags as string).split(",").map((t: string) => t.trim()) : [],
    category: typeof item.category === "string" ? item.category : "",
  };
}
