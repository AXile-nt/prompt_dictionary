import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@prompt-dictionary/database";
import dotenv from "dotenv";
import { classifyByKeywords } from "../ai/rules/keyword";

dotenv.config({ path: "../../.env" });

const DEFAULT_PROMPT_DIR = process.env.LOCAL_PROMPT_DIR || "";
const LOCAL_PROMPT_SOURCE = "local-custom-prompts";
const SUPPORTED_EXTENSIONS = new Set([".md", ".txt"]);

interface LocalPrompt {
  title: string;
  content: string;
  relativePath: string;
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

function titleFromFile(filePath: string): string {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, " ").trim();
}

async function collectFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) return [fullPath];
    return [];
  }));
  return files.flat();
}

async function readLocalPrompts(root: string): Promise<LocalPrompt[]> {
  const files = await collectFiles(root);
  const prompts: LocalPrompt[] = [];

  for (const file of files) {
    const content = (await fs.readFile(file, "utf8")).trim();
    if (!content) continue;
    prompts.push({
      title: titleFromFile(file),
      content,
      relativePath: path.relative(root, file).replace(/\\/g, "/"),
    });
  }

  return prompts;
}

async function replaceTags(promptId: string, tags: string[]) {
  const uniqueTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
  await prisma.promptTagRelation.deleteMany({ where: { promptId } });

  for (const tagName of uniqueTags) {
    const tag = await prisma.promptTag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
    await prisma.promptTagRelation.create({ data: { promptId, tagId: tag.id } });
  }
}

async function main() {
  const root = process.argv[2] || DEFAULT_PROMPT_DIR;
  if (!root) {
    console.error("Usage: pnpm import:local-prompts -- <path-to-your-local-prompt-folder>");
    console.error("Or set LOCAL_PROMPT_DIR in your local .env file.");
    process.exitCode = 1;
    return;
  }

  const prompts = await readLocalPrompts(root);
  const importedAt = new Date();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of prompts) {
    const classification = classifyByKeywords(item.content);
    const category = await prisma.category.findUnique({ where: { slug: classification.slug } });
    const externalId = slugify(item.relativePath);
    const existing = await prisma.prompt.findFirst({
      where: { source: "CUSTOM", externalSource: LOCAL_PROMPT_SOURCE, externalId },
    });
    const data = {
      title: item.title,
      content: item.content,
      description: classification.description,
      categoryId: category?.id || null,
      lastSyncedAt: importedAt,
    };

    if (existing) {
      const changed =
        existing.title !== data.title ||
        existing.content !== data.content ||
        existing.description !== data.description ||
        existing.categoryId !== data.categoryId;

      await prisma.prompt.update({
        where: { id: existing.id },
        data: changed ? data : { lastSyncedAt: importedAt },
      });
      if (changed) {
        await replaceTags(existing.id, ["local", "custom", ...classification.tags]);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    const prompt = await prisma.prompt.create({
      data: {
        ...data,
        source: "CUSTOM",
        externalSource: LOCAL_PROMPT_SOURCE,
        externalId,
        targetModels: "[]",
        useCases: "[]",
        placeholders: "[]",
      },
    });
    await replaceTags(prompt.id, ["local", "custom", ...classification.tags]);
    created++;
  }

  await prisma.importJob.create({
    data: {
      filename: path.basename(root) || "local-prompts",
      status: "COMPLETED",
      totalItems: prompts.length,
      importedItems: created + updated,
      failedItems: 0,
      finishedAt: importedAt,
    },
  });

  console.log(JSON.stringify({ root, total: prompts.length, created, updated, skipped }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
