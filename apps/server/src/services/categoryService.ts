import { prisma } from "@prompt-dictionary/database";
import { NotFoundError, ValidationError } from "../middleware/errorHandler";

class CategoryService {
  async findAll() {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { prompts: { where: { isArchived: false } } } },
      },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      isDefault: c.isDefault,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      promptCount: c._count.prompts,
    }));
  }

  async create(data: { name: string; slug: string; description?: string }) {
    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        isDefault: false,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
    }
  ) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Category not found");
    if (existing.isDefault)
      throw new ValidationError("Cannot edit default categories");

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { prompts: true } } },
    });
    if (!existing) throw new NotFoundError("Category not found");
    if (existing.isDefault)
      throw new ValidationError("Cannot delete default categories");
    if (existing._count.prompts > 0)
      throw new ValidationError(
        "Cannot delete category with prompts. Move or reassign prompts first."
      );

    return prisma.category.delete({ where: { id } });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    const updates = items.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );
    return Promise.all(updates);
  }
}

export const categoryService = new CategoryService();
