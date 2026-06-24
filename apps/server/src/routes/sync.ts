import { Router, Request, Response, NextFunction } from "express";
import { syncDefaultPrompts } from "../sync/prompts-chat";
import { apiResponse } from "../utils/response";
import { prisma } from "@prompt-dictionary/database";

const router: Router = Router();

router.post("/default-prompts", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await syncDefaultPrompts();
    return apiResponse(res, result, 200);
  } catch (err) { next(err); }
});

router.get("/status", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const lastSync = await prisma.appSetting.findUnique({ where: { key: "last_sync_at" } });
    const statsSetting = await prisma.appSetting.findUnique({ where: { key: "last_sync_stats" } });
    const defaultCount = await prisma.prompt.count({ where: { source: "DEFAULT" } });

    return apiResponse(res, {
      lastSyncAt: lastSync?.value || null,
      stats: statsSetting?.value ? JSON.parse(statsSetting.value) : null,
      defaultPromptCount: defaultCount,
    });
  } catch (err) { next(err); }
});

export default router;
