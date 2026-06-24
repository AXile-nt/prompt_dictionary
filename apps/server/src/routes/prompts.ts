import { Router, Request, Response, NextFunction } from "express";
import { promptService } from "../services/promptService";
import { optimizePrompt } from "../services/aiService";
import * as versionService from "../services/versionService";
import { apiResponse, paginatedResponse } from "../utils/response";
import { validateBody, validateParams } from "../middleware/validate";
import prisma from "../db/client";

const router: Router = Router();

// GET /api/prompts - List all prompts with filters
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      q: req.query.q as string | undefined,
      category: req.query.category as string | undefined,
      source: req.query.source as string | undefined,
      tags: req.query.tags as string | undefined,
      favorite: req.query.favorite === "true" ? true : req.query.favorite === "false" ? false : undefined,
      sort: (req.query.sort as "best" | "updated" | "usage" | "created") || undefined,
      order: (req.query.order as "asc" | "desc") || undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };
    const result = await promptService.findAll(filters);
    return paginatedResponse(res, result.items, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
});

// GET /api/prompts/export - Export prompts as JSON download (MUST be before /:id routes)
router.get("/export", async (_req: Request, res: Response) => {
  try {
    const source = _req.query.source as string | undefined;

    const where: Record<string, unknown> = {};
    if (source) {
      where.source = source;
    }

    const prompts = await prisma.prompt.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const exported = prompts.map((p) => ({
      title: p.title,
      description: p.description,
      content: p.content,
      source: p.source,
      category: p.category?.slug ?? null,
      tags: p.tags.map((pt) => pt.tag.name),
      targetModels: JSON.parse(p.targetModels),
      useCases: JSON.parse(p.useCases),
      placeholders: JSON.parse(p.placeholders),
      favorite: p.favorite,
      usageCount: p.usageCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="prompts-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.json(exported);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    res.status(500).json({ success: false, data: null, error: message });
  }
});

// Helper to safely extract string param
function param(req: Request, name: string): string {
  const val = req.params[name];
  return typeof val === "string" ? val : String(val);
}

// GET /api/prompts/:id - Get prompt by ID
router.get("/:id", validateParams(["id"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.findById(param(req, "id"));
    return apiResponse(res, prompt);
  } catch (err) {
    next(err);
  }
});

// POST /api/prompts - Create a new custom prompt
router.post("/", validateBody(["title", "content"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.create(req.body);
    return apiResponse(res, prompt, 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/prompts/:id - Update a custom prompt (auto-snapshots before update)
router.put("/:id", validateParams(["id"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = param(req, "id");
    // Auto-create version snapshot before update
    try {
      await versionService.createVersion({
        promptId: id,
        changeNote: "Auto-snapshot before edit",
      });
    } catch {
      console.warn(`Failed to auto-snapshot prompt ${id} before update`);
    }
    const prompt = await promptService.update(id, req.body);
    return apiResponse(res, prompt);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/prompts/:id - Delete a custom prompt
router.delete("/:id", validateParams(["id"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await promptService.remove(param(req, "id"));
    return apiResponse(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/prompts/:id/copy - Copy default prompt to custom
router.post("/:id/copy", validateParams(["id"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.copyToCustom(param(req, "id"));
    return apiResponse(res, prompt, 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/prompts/:id/favorite - Toggle favorite
router.post("/:id/favorite", validateParams(["id"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.toggleFavorite(param(req, "id"));
    return apiResponse(res, prompt);
  } catch (err) {
    next(err);
  }
});

// POST /api/prompts/:id/use - Record usage
router.post("/:id/use", validateParams(["id"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await promptService.recordUsage(param(req, "id"));
    return apiResponse(res, prompt);
  } catch (err) {
    next(err);
  }
});

// POST /api/prompts/:id/optimize - AI optimize a prompt (returns result, does NOT save)
router.post("/:id/optimize", validateParams(["id"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goal } = req.body as { goal: string };

    if (!goal || typeof goal !== "string") {
      res.status(400).json({
        success: false,
        data: null,
        error: "Optimization goal is required",
      });
      return;
    }

    const prompt = await promptService.findById(param(req, "id"));
    if (!prompt) {
      res.status(404).json({
        success: false,
        data: null,
        error: "Prompt not found",
      });
      return;
    }

    const result = await optimizePrompt(prompt.content, goal);

    res.json({
      success: true,
      data: {
        original: prompt.content,
        optimized: result.optimized_content,
        changes_summary: result.changes_summary,
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Optimization failed";
    const status = message.includes("not configured") ? 400 : 500;
    res.status(status).json({ success: false, data: null, error: message });
  }
});

// POST /api/prompts/:id/version - Manually create a version snapshot
router.post("/:id/version", validateParams(["id"]), async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const { changeNote } = (req.body ?? {}) as { changeNote?: string };
    const version = await versionService.createVersion({
      promptId: id,
      changeNote,
    });
    res.json({ success: true, data: version, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create version";
    res.status(500).json({ success: false, data: null, error: message });
  }
});

// GET /api/prompts/:id/versions - List all versions (newest first)
router.get("/:id/versions", validateParams(["id"]), async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const versions = await versionService.getVersions(id);
    res.json({ success: true, data: versions, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get versions";
    res.status(500).json({ success: false, data: null, error: message });
  }
});

// GET /api/prompts/:id/versions/:v - Get a specific version
router.get("/:id/versions/:v", validateParams(["id"]), async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const v = String(req.params.v);
    const versionNumber = parseInt(v, 10);
    if (isNaN(versionNumber)) {
      res.status(400).json({ success: false, data: null, error: "Invalid version number" });
      return;
    }
    const version = await versionService.getVersion(id, versionNumber);
    res.json({ success: true, data: version, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get version";
    res.status(404).json({ success: false, data: null, error: message });
  }
});

// POST /api/prompts/:id/versions/:v/restore - Restore to a specific version
router.post("/:id/versions/:v/restore", validateParams(["id"]), async (req: Request, res: Response) => {
  try {
    const id = param(req, "id");
    const v = String(req.params.v);
    const { changeNote } = (req.body ?? {}) as { changeNote?: string };
    const versionNumber = parseInt(v, 10);
    if (isNaN(versionNumber)) {
      res.status(400).json({ success: false, data: null, error: "Invalid version number" });
      return;
    }
    const updated = await versionService.restoreVersion(id, versionNumber, changeNote);
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to restore version";
    res.status(500).json({ success: false, data: null, error: message });
  }
});

export default router;
