import { prisma } from "@prompt-dictionary/database";
import { AppError, NotFoundError, ForbiddenError } from "../middleware/errorHandler";

export interface PromptFilters {
  q?: string;
  category?: string;
  source?: string;
  tags?: string;
  favorite?: boolean;
  sort?: "best" | "updated" | "usage" | "created";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

class PromptService {
  async findAll(filters: PromptFilters) {
    const {
      q,
      category,
      source,
      tags,
      favorite,
      sort = "updated",
      order = "desc",
      page = 1,
      limit = 20,
    } = filters;

    if (sort === "best" && q?.trim()) {
      return this.findBestMatches({ ...filters, q: q.trim(), page, limit });
    }

    const where: any = { isArchived: false };

    if (source) {
      where.source = source.toUpperCase();
    }

    if (favorite !== undefined) {
      where.favorite = favorite;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (tags) {
      const tagNames = tags.split(",").map((t) => t.trim());
      where.tags = {
        some: { tag: { name: { in: tagNames } } },
      };
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { content: { contains: q } },
      ];
    }

    const orderBy: any = {};
    switch (sort) {
      case "usage":
        orderBy.usageCount = order === "asc" ? "asc" : "desc";
        break;
      case "created":
        orderBy.createdAt = order === "asc" ? "asc" : "desc";
        break;
      case "best":
      case "updated":
      default:
        orderBy.updatedAt = order === "asc" ? "asc" : "desc";
        break;
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      }),
      prisma.prompt.count({ where }),
    ]);

    return {
      items: this.serializePrompts(prompts),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async findBestMatches(filters: PromptFilters & { q: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const matchQuery = this.toFtsQuery(filters.q);

    try {
      const clauses = ["p.isArchived = 0", "prompts_fts MATCH ?"];
      const params: unknown[] = [matchQuery];

      if (filters.source) {
        clauses.push("p.source = ?");
        params.push(filters.source.toUpperCase());
      }

      if (filters.favorite !== undefined) {
        clauses.push("p.favorite = ?");
        params.push(filters.favorite ? 1 : 0);
      }

      if (filters.category) {
        clauses.push("c.slug = ?");
        params.push(filters.category);
      }

      if (filters.tags) {
        const tagNames = filters.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
        if (tagNames.length > 0) {
          clauses.push(`EXISTS (
            SELECT 1 FROM PromptTagRelation ptr
            JOIN PromptTag pt ON pt.id = ptr.tag_id
            WHERE ptr.prompt_id = p.id AND pt.name IN (${tagNames.map(() => "?").join(",")})
          )`);
          params.push(...tagNames);
        }
      }

      const whereSql = clauses.join(" AND ");
      const countRows = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total
         FROM prompts_fts
         JOIN Prompt p ON p.rowid = prompts_fts.rowid
         LEFT JOIN Category c ON c.id = p.categoryId
         WHERE ${whereSql}`,
        ...params,
      );
      const total = Number((countRows as any[])[0]?.total || 0);

      const rows = await prisma.$queryRawUnsafe(
        `SELECT p.id
         FROM prompts_fts
         JOIN Prompt p ON p.rowid = prompts_fts.rowid
         LEFT JOIN Category c ON c.id = p.categoryId
         WHERE ${whereSql}
         ORDER BY bm25(prompts_fts, 8.0, 3.0, 1.0), p.usageCount DESC, p.updatedAt DESC
         LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset,
      );
      const ids = (rows as Array<{ id: string }>).map((row) => row.id);

      if (ids.length === 0) {
        return { items: [], total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      const prompts = await prisma.prompt.findMany({
        where: { id: { in: ids } },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });
      const promptById = new Map(prompts.map((prompt) => [prompt.id, prompt]));
      const orderedPrompts = ids.flatMap((id) => {
        const prompt = promptById.get(id);
        return prompt ? [prompt] : [];
      });

      return {
        items: this.serializePrompts(orderedPrompts),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      return this.findLikeBestMatches(filters);
    }
  }

  private async findLikeBestMatches(filters: PromptFilters & { q: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const query = filters.q.toLowerCase();
    const where: any = {
      isArchived: false,
      OR: [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { content: { contains: filters.q } },
      ],
    };

    if (filters.source) where.source = filters.source.toUpperCase();
    if (filters.favorite !== undefined) where.favorite = filters.favorite;
    if (filters.category) where.category = { slug: filters.category };
    if (filters.tags) {
      const tagNames = filters.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      if (tagNames.length > 0) where.tags = { some: { tag: { name: { in: tagNames } } } };
    }

    const [allMatches, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: { category: true, tags: { include: { tag: true } } },
      }),
      prisma.prompt.count({ where }),
    ]);

    const ranked = allMatches
      .sort((a, b) => this.scorePrompt(b, query) - this.scorePrompt(a, query) || b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice((page - 1) * limit, page * limit);

    return {
      items: this.serializePrompts(ranked),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toFtsQuery(query: string): string {
    return query
      .split(/\s+/)
      .map((term) => term.replace(/"/g, "").trim())
      .filter(Boolean)
      .map((term) => `"${term}"`)
      .join(" OR ");
  }

  private scorePrompt(prompt: { title: string; description: string; content: string; usageCount: number }, query: string): number {
    const title = prompt.title.toLowerCase();
    const description = prompt.description.toLowerCase();
    const content = prompt.content.toLowerCase();
    let score = 0;
    if (title.includes(query)) score += 100;
    if (description.includes(query)) score += 30;
    if (content.includes(query)) score += 10;
    score += Math.min(prompt.usageCount, 20);
    return score;
  }

  private serializePrompts(prompts: Array<any>) {
    return prompts.map((p) => ({
      ...p,
      tags: p.tags.map((t: any) => t.tag.name),
      targetModels: JSON.parse(p.targetModels || "[]"),
      useCases: JSON.parse(p.useCases || "[]"),
      placeholders: JSON.parse(p.placeholders || "[]"),
      contentPreview: p.content.substring(0, 150),
    }));
  }

  async findById(id: string) {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!prompt) {
      throw new NotFoundError("Prompt not found");
    }

    return {
      ...prompt,
      tags: prompt.tags.map((t) => t.tag.name),
      targetModels: JSON.parse(prompt.targetModels || "[]"),
      useCases: JSON.parse(prompt.useCases || "[]"),
      placeholders: JSON.parse(prompt.placeholders || "[]"),
    };
  }

  async create(data: {
    title: string;
    description?: string;
    content: string;
    categoryId?: string;
    tags?: string[];
    targetModels?: string[];
    useCases?: string[];
    placeholders?: string[];
    favorite?: boolean;
  }) {
    const prompt = await prisma.prompt.create({
      data: {
        title: data.title,
        description: data.description || "",
        content: data.content,
        categoryId: data.categoryId ?? null,
        source: "CUSTOM",
        targetModels: JSON.stringify(data.targetModels || []),
        useCases: JSON.stringify(data.useCases || []),
        placeholders: JSON.stringify(data.placeholders || []),
        favorite: data.favorite || false,
      },
    });

    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
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

    return this.findById(prompt.id);
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    content?: string;
    categoryId?: string | null;
    tags?: string[];
    targetModels?: string[];
    useCases?: string[];
    placeholders?: string[];
    favorite?: boolean;
    isArchived?: boolean;
  }) {
    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Prompt not found");
    }
    if (existing.source === "DEFAULT") {
      throw new ForbiddenError("Cannot edit default prompts. Copy to custom first.");
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.targetModels !== undefined) updateData.targetModels = JSON.stringify(data.targetModels);
    if (data.useCases !== undefined) updateData.useCases = JSON.stringify(data.useCases);
    if (data.placeholders !== undefined) updateData.placeholders = JSON.stringify(data.placeholders);
    if (data.favorite !== undefined) updateData.favorite = data.favorite;
    if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

    await prisma.prompt.update({ where: { id }, data: updateData });

    if (data.tags !== undefined) {
      await prisma.promptTagRelation.deleteMany({ where: { promptId: id } });
      for (const tagName of data.tags) {
        const tag = await prisma.promptTag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await prisma.promptTagRelation.create({
          data: { promptId: id, tagId: tag.id },
        });
      }
    }

    return this.findById(id);
  }

  async remove(id: string) {
    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Prompt not found");
    }
    if (existing.source === "DEFAULT") {
      throw new ForbiddenError("Cannot delete default prompts.");
    }
    await prisma.prompt.delete({ where: { id } });
    return { success: true };
  }

  async copyToCustom(id: string) {
    const existing = await prisma.prompt.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!existing) {
      throw new NotFoundError("Prompt not found");
    }
    if (existing.source === "CUSTOM") {
      throw new ForbiddenError("Prompt is already a custom prompt.");
    }

    const tagNames = existing.tags.map((t) => t.tag.name);

    return this.create({
      title: `${existing.title} (Copy)`,
      description: existing.description,
      content: existing.content,
      categoryId: existing.categoryId ?? undefined,
      tags: tagNames,
      targetModels: JSON.parse(existing.targetModels || "[]"),
      useCases: JSON.parse(existing.useCases || "[]"),
      placeholders: JSON.parse(existing.placeholders || "[]"),
    });
  }

  async toggleFavorite(id: string) {
    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Prompt not found");
    }
    await prisma.prompt.update({
      where: { id },
      data: { favorite: !existing.favorite },
    });
    return this.findById(id);
  }

  async recordUsage(id: string) {
    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Prompt not found");
    }
    await prisma.prompt.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    return this.findById(id);
  }
}

export const promptService = new PromptService();
