import { Router, Request, Response, NextFunction } from "express";
import { importService } from "../services/importService";
import { apiResponse } from "../utils/response";

const router: Router = Router();

router.post("/upload", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename, content } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ success: false, data: null, error: "filename and content required" });
    }
    const result = await importService.upload(filename, content);
    return apiResponse(res, result, 200);
  } catch (err) { next(err); }
});

router.get("/:jobId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await importService.getStatus(req.params.jobId as string);
    if (!job) return res.status(404).json({ success: false, data: null, error: "Job not found" });
    return apiResponse(res, job);
  } catch (err) { next(err); }
});

router.post("/:jobId/confirm", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await importService.confirm(req.params.jobId as string, req.body.items);
    return apiResponse(res, result);
  } catch (err) { next(err); }
});

router.post("/:jobId/cancel", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await importService.cancel(req.params.jobId as string);
    return apiResponse(res, result);
  } catch (err) { next(err); }
});

export default router;
