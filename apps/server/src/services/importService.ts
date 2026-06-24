import { prisma } from "@prompt-dictionary/database";
import { importFile, ParsedPrompt } from "../importers";
import { classifyByKeywords } from "../ai/rules/keyword";

class ImportService {
  async upload(filename: string, content: string) {
    const { items, errors } = importFile(filename, content);

    const classified = items.map((item) => {
      const classification = classifyByKeywords(item.content);
      return {
        ...item,
        suggestedCategory: classification.slug,
        suggestedTags: classification.tags,
        suggestedDescription: item.description || classification.description,
      };
    });

    const job = await prisma.importJob.create({
      data: { filename, status: "PENDING", totalItems: classified.length },
    });

    return { job, items: classified, errors };
  }

  async confirm(jobId: string, items: ParsedPrompt[]) {
    const job = await prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Import job not found");

    await prisma.importJob.update({ where: { id: jobId }, data: { status: "PROCESSING" } });

    let imported = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const category = item.category
          ? await prisma.category.findFirst({ where: { slug: item.category } })
          : null;

        const prompt = await prisma.prompt.create({
          data: {
            title: item.title,
            content: item.content,
            description: item.description || "",
            source: "CUSTOM",
            categoryId: category?.id || null,
            targetModels: "[]",
            useCases: "[]",
            placeholders: "[]",
          },
        });

        if (item.tags && item.tags.length > 0) {
          for (const tagName of item.tags) {
            const tag = await prisma.promptTag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            });
            await prisma.promptTagRelation.create({
              data: { promptId: prompt.id, tagId: tag.id },
            });
          }
        }
        imported++;
      } catch {
        failed++;
      }
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        importedItems: imported,
        failedItems: failed,
        finishedAt: new Date(),
      },
    });

    return { imported, failed };
  }

  async getStatus(jobId: string) {
    return prisma.importJob.findUnique({ where: { id: jobId } });
  }

  async cancel(jobId: string) {
    return prisma.importJob.update({
      where: { id: jobId },
      data: { status: "FAILED", finishedAt: new Date() },
    });
  }
}

export const importService = new ImportService();
