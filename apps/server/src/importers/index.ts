import { ParsedPrompt } from "./json-importer";
import { parseJson } from "./json-importer";
import { parseMarkdown } from "./markdown-importer";
import { parseText } from "./text-importer";
import { parseCsv } from "./csv-importer";

export type { ParsedPrompt };

export function importFile(filename: string, content: string): { items: ParsedPrompt[]; errors: string[] } {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json": return parseJson(content);
    case "md":
    case "markdown": return parseMarkdown(content);
    case "txt": return parseText(content);
    case "csv": return parseCsv(content);
    default: return { items: [], errors: [`Unsupported file type: .${ext}`] };
  }
}
