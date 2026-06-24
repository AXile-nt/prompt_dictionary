import { Router, Request, Response, NextFunction } from "express";
import { searchService } from "../services/searchService";
import { paginatedResponse, errorResponse } from "../utils/response";

const router: Router = Router();

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query.q as string;
      if (!q || !q.trim()) {
        return errorResponse(res, "Search query 'q' is required", 400);
      }
      const type = (req.query.type as string) || "all";
      const page = req.query.page
        ? parseInt(req.query.page as string)
        : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : 20;

      const result = await searchService.search(
        q.trim(),
        type,
        page,
        limit
      );
      return paginatedResponse(
        res,
        result.items,
        result.total,
        result.page,
        result.limit
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
