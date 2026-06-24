import { prisma } from "@prompt-dictionary/database";

export interface SearchResult {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class SearchService {
  async search(
    query: string,
    type: string = "all",
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult> {
    const offset = (page - 1) * limit;
    const escapedQuery = query.replace(/"/g, '""');

    let whereSQL: string;
    if (type === "title") {
      whereSQL = "prompts_fts.title MATCH ?";
    } else if (type === "content") {
      whereSQL = "prompts_fts.content MATCH ?";
    } else {
      whereSQL = "prompts_fts MATCH ?";
    }

    try {
      const countResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total FROM prompts_fts WHERE ${whereSQL}`,
        escapedQuery
      );
      const total = Number((countResult as any[])[0]?.total || 0);

      const results = await prisma.$queryRawUnsafe(
        `SELECT p.id, p.title, p.description, p.source, p.favorite, p.usageCount, p.updatedAt, p.categoryId,
                snippet(prompts_fts, 0, '<mark>', '</mark>', '...', 30) as title_highlight,
                snippet(prompts_fts, 2, '<mark>', '</mark>', '...', 50) as content_highlight
         FROM prompts_fts f
         JOIN Prompt p ON p.rowid = f.rowid
         WHERE ${whereSQL} AND p.isArchived = 0
         ORDER BY rank
         LIMIT ? OFFSET ?`,
        escapedQuery,
        limit,
        offset
      );

      const items = (results as any[]).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        source: r.source,
        favorite: r.favorite,
        usageCount: r.usageCount,
        updatedAt: r.updatedAt,
        categoryId: r.categoryId,
        titleHighlight: r.title_highlight,
        contentHighlight: r.content_highlight,
        contentPreview: r.content_highlight || r.description || "",
      }));

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err) {
      // Fallback to LIKE search if FTS5 fails
      return this.likeSearch(query, type, page, limit);
    }
  }

  private async likeSearch(
    query: string,
    type: string,
    page: number,
    limit: number
  ): Promise<SearchResult> {
    const where: any = { isArchived: false };

    if (type === "title") {
      where.title = { contains: query };
    } else if (type === "content") {
      where.content = { contains: query };
    } else {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { content: { contains: query } },
      ];
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, tags: { include: { tag: true } } },
      }),
      prisma.prompt.count({ where }),
    ]);

    const items = prompts.map((p) => ({
      ...p,
      tags: p.tags.map((t) => t.tag.name),
      targetModels: JSON.parse(p.targetModels || "[]"),
      useCases: JSON.parse(p.useCases || "[]"),
      contentPreview: p.content.substring(0, 150),
      titleHighlight: p.title,
      contentHighlight: p.description || p.content.substring(0, 150),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const searchService = new SearchService();
