import { prisma } from "@prompt-dictionary/database";
import { classifyByKeywords } from "../ai/rules/keyword";

const REMOTE_SOURCES = [
  {
    key: "prompts-chat",
    label: "f/prompts.chat",
    url: "https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv",
    parser: parsePromptsChatCsv,
  },
  {
    key: "awesome-chatgpt-prompts-zh",
    label: "PlexPt/awesome-chatgpt-prompts-zh",
    url: "https://raw.githubusercontent.com/PlexPt/awesome-chatgpt-prompts-zh/main/prompts-zh.json",
    parser: parseAwesomePromptsZh,
  },
  {
    key: "prompt-engineering-guide",
    label: "dair-ai/Prompt-Engineering-Guide",
    url: "https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/guides/prompts-basic-usage.md",
    parser: parsePromptEngineeringGuide,
  },
] as const;

export interface SyncStats {
  total: number;
  new: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
  sources?: Record<string, Omit<SyncStats, "sources">>;
}

interface PromptCandidate {
  title: string;
  content: string;
  description?: string;
  externalId: string;
  externalSource: string;
  tags?: string[];
  categorySlug?: string;
}

interface SyncContext {
  syncedAt: Date;
  categories: Map<string, string>;
  tags: Map<string, string>;
  existing: Map<string, {
    id: string;
    title: string;
    content: string;
    description: string;
    categoryId: string | null;
  }>;
}

function emptyStats(): SyncStats {
  return { total: 0, new: 0, updated: 0, skipped: 0, errors: 0, errorMessages: [] };
}

function addStats(target: SyncStats, source: SyncStats) {
  target.total += source.total;
  target.new += source.new;
  target.updated += source.updated;
  target.skipped += source.skipped;
  target.errors += source.errors;
  target.errorMessages.push(...source.errorMessages);
}

function uniqueCandidates(candidates: PromptCandidate[]): PromptCandidate[] {
  const byId = new Map<string, PromptCandidate>();
  for (const candidate of candidates) {
    if (!byId.has(candidate.externalId)) byId.set(candidate.externalId, candidate);
  }
  return [...byId.values()];
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || hashText(text);
}

function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function compactDescription(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

function parseCsv(csvText: string): Array<Record<string, string>> {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = "";
      if (char === "\r" && csvText[i + 1] === "\n") i++;
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").trim();
    });
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parsePromptsChatCsv(text: string): PromptCandidate[] {
  return parseCsv(text).flatMap((row) => {
    const act = row.act?.trim();
    const prompt = row.prompt?.trim();
    if (!act || !prompt) return [];

    let content = prompt;
    if ((row.type || "").trim().toUpperCase() === "JSON") {
      try {
        content = JSON.stringify(JSON.parse(prompt), null, 2);
      } catch {
        content = prompt;
      }
    }

    const tags = ["prompts.chat"];
    if (row.for_devs?.trim().toUpperCase() === "TRUE") tags.push("dev");

    return [{
      title: act,
      content,
      description: `Act as ${act}`,
      externalId: slugify(act),
      externalSource: "prompts-chat",
      tags,
      categorySlug: row.for_devs?.trim().toUpperCase() === "TRUE" ? "code-development" : undefined,
    }];
  });
}

function parseAwesomePromptsZh(text: string): PromptCandidate[] {
  const raw = JSON.parse(text) as Array<{ act?: string; prompt?: string }>;
  return raw.flatMap((item) => {
    const title = item.act?.trim();
    const content = item.prompt?.trim();
    if (!title || !content) return [];
    return [{
      title,
      content,
      description: compactDescription(content),
      externalId: slugify(title),
      externalSource: "awesome-chatgpt-prompts-zh",
      tags: ["中文", "awesome-chatgpt-prompts-zh"],
    }];
  });
}

function parsePromptEngineeringGuide(text: string): PromptCandidate[] {
  const prompts: PromptCandidate[] = [];
  const sectionPattern = /^##\s+(.+)$/gm;
  const sections: Array<{ title: string; start: number; end: number }> = [];
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = sectionPattern.exec(text)) !== null) {
    if (sections.length > 0) sections[sections.length - 1].end = sectionMatch.index;
    sections.push({ title: sectionMatch[1].trim(), start: sectionPattern.lastIndex, end: text.length });
  }

  for (const section of sections) {
    const block = text.slice(section.start, section.end);
    const promptPattern = /\*Prompt:\*\s*```(?:[\w-]+)?\s*([\s\S]*?)```/g;
    let promptMatch: RegExpExecArray | null;
    let index = 1;

    while ((promptMatch = promptPattern.exec(block)) !== null) {
      const content = promptMatch[1].trim();
      if (!content) continue;
      const title = `${section.title} Example ${index}`;
      prompts.push({
        title,
        content,
        description: `Prompt Engineering Guide example: ${section.title}`,
        externalId: slugify(`${section.title}-${index}-${hashText(content)}`),
        externalSource: "prompt-engineering-guide",
        tags: ["prompt-engineering", "example", section.title.toLowerCase()],
        categorySlug: section.title.toLowerCase().includes("code") ? "code-development" : "learning",
      });
      index++;
    }
  }

  return prompts;
}

async function upsertPrompt(candidate: PromptCandidate, context: SyncContext): Promise<"new" | "updated" | "skipped"> {
  const classification = classifyByKeywords(candidate.content);
  const categorySlug = candidate.categorySlug || classification.slug;
  const categoryId = context.categories.get(categorySlug) || null;
  const existing = context.existing.get(candidate.externalId);

  const data = {
    title: candidate.title,
    content: candidate.content,
    description: candidate.description || classification.description,
    categoryId,
    lastSyncedAt: context.syncedAt,
  };

  if (existing) {
    const changed =
      existing.title !== data.title ||
      existing.content !== data.content ||
      existing.description !== data.description ||
      existing.categoryId !== data.categoryId;

    await prisma.prompt.update({
      where: { id: existing.id },
      data: changed ? data : { lastSyncedAt: context.syncedAt },
    });
    if (changed) await replaceTags(existing.id, [...(candidate.tags || []), ...classification.tags], context);
    return changed ? "updated" : "skipped";
  }

  const prompt = await prisma.prompt.create({
    data: {
      ...data,
      source: "DEFAULT",
      externalId: candidate.externalId,
      externalSource: candidate.externalSource,
      targetModels: "[]",
      useCases: "[]",
      placeholders: "[]",
    },
  });
  context.existing.set(candidate.externalId, {
    id: prompt.id,
    title: prompt.title,
    content: prompt.content,
    description: prompt.description,
    categoryId: prompt.categoryId,
  });
  await replaceTags(prompt.id, [...(candidate.tags || []), ...classification.tags], context);
  return "new";
}

async function replaceTags(promptId: string, tags: string[], context: SyncContext) {
  const uniqueTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
  await prisma.promptTagRelation.deleteMany({ where: { promptId } });

  for (const tagName of uniqueTags) {
    let tagId = context.tags.get(tagName);
    if (!tagId) {
      const tag = await prisma.promptTag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      tagId = tag.id;
      context.tags.set(tagName, tagId);
    }
    await prisma.promptTagRelation.create({
      data: { promptId, tagId },
    });
  }
}

async function createSyncContext(externalSource: string, syncedAt: Date): Promise<SyncContext> {
  const [categories, tags, existing] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true } }),
    prisma.promptTag.findMany({ select: { id: true, name: true } }),
    prisma.prompt.findMany({
      where: { source: "DEFAULT", externalSource },
      select: { id: true, externalId: true, title: true, content: true, description: true, categoryId: true },
    }),
  ]);

  return {
    syncedAt,
    categories: new Map(categories.map((category) => [category.slug, category.id])),
    tags: new Map(tags.map((tag) => [tag.name, tag.id])),
    existing: new Map(existing.flatMap((prompt) => (
      prompt.externalId
        ? [[prompt.externalId, {
          id: prompt.id,
          title: prompt.title,
          content: prompt.content,
          description: prompt.description,
          categoryId: prompt.categoryId,
        }]]
        : []
    ))),
  };
}

async function syncBulkCandidates(candidates: PromptCandidate[], context: SyncContext): Promise<SyncStats> {
  const stats = emptyStats();
  const unique = uniqueCandidates(candidates);
  stats.total = candidates.length;
  stats.skipped += candidates.length - unique.length;

  const toCreate = [];
  const toUpdate: Array<{ id: string; data: {
    title: string;
    content: string;
    description: string;
    categoryId: string | null;
    lastSyncedAt: Date;
  } }> = [];

  for (const candidate of unique) {
    const classification = classifyByKeywords(candidate.content);
    const categoryId = context.categories.get(candidate.categorySlug || classification.slug) || null;
    const data = {
      title: candidate.title,
      content: candidate.content,
      description: candidate.description || classification.description,
      categoryId,
      lastSyncedAt: context.syncedAt,
    };
    const existing = context.existing.get(candidate.externalId);

    if (!existing) {
      toCreate.push({
        ...data,
        source: "DEFAULT",
        externalId: candidate.externalId,
        externalSource: candidate.externalSource,
        targetModels: "[]",
        useCases: "[]",
        placeholders: "[]",
      });
      continue;
    }

    const changed =
      existing.title !== data.title ||
      existing.content !== data.content ||
      existing.description !== data.description ||
      existing.categoryId !== data.categoryId;

    if (changed) {
      toUpdate.push({ id: existing.id, data });
    } else {
      stats.skipped++;
    }
  }

  for (const batch of chunks(toCreate, 500)) {
    const result = await prisma.prompt.createMany({ data: batch });
    stats.new += result.count;
  }

  for (const item of toUpdate) {
    await prisma.prompt.update({ where: { id: item.id }, data: item.data });
    stats.updated++;
  }

  return stats;
}

export async function syncDefaultPrompts(): Promise<{ success: boolean; stats: SyncStats; syncedAt: Date }> {
  const stats = emptyStats();
  stats.sources = {};
  const syncedAt = new Date();

  for (const source of REMOTE_SOURCES) {
    const sourceStats = emptyStats();
    stats.sources[source.key] = sourceStats;

    try {
      const response = await fetch(source.url);
      if (!response.ok) throw new Error(`Failed to fetch ${source.label}: ${response.status} ${response.statusText}`);

      const text = await response.text();
      const candidates = source.parser(text);
      const context = await createSyncContext(source.key, syncedAt);
      if (candidates.length > 500) {
        const bulkStats = await syncBulkCandidates(candidates, context);
        addStats(sourceStats, bulkStats);
      } else {
        sourceStats.total = candidates.length;
        for (const candidate of candidates) {
          try {
            const result = await upsertPrompt(candidate, context);
            sourceStats[result]++;
          } catch (err) {
            sourceStats.errors++;
            sourceStats.errorMessages.push(`${candidate.title}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      await prisma.prompt.updateMany({
        where: { source: "DEFAULT", externalSource: source.key },
        data: { lastSyncedAt: syncedAt },
      });
    } catch (err) {
      sourceStats.errors++;
      sourceStats.errorMessages.push(err instanceof Error ? err.message : String(err));
    }

    addStats(stats, sourceStats);
  }

  await prisma.appSetting.upsert({
    where: { key: "last_sync_at" },
    update: { value: syncedAt.toISOString() },
    create: { key: "last_sync_at", value: syncedAt.toISOString() },
  });
  await prisma.appSetting.upsert({
    where: { key: "last_sync_stats" },
    update: { value: JSON.stringify(stats) },
    create: { key: "last_sync_stats", value: JSON.stringify(stats) },
  });

  return { success: true, stats, syncedAt };
}
