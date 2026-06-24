import { Router, Request, Response, NextFunction } from "express";
import { categoryService } from "../services/categoryService";
import { apiResponse } from "../utils/response";

const router: Router = Router();

router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await categoryService.findAll();
      return apiResponse(res, categories);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, slug, description } = req.body;
      if (!name || !slug) return apiResponse(res, null, 400);
      const category = await categoryService.create({
        name,
        slug,
        description,
      });
      return apiResponse(res, category, 201);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const category = await categoryService.update(id, req.body);
      return apiResponse(res, category);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await categoryService.remove(id);
      return apiResponse(res, { deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/reorder",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) return apiResponse(res, null, 400);
      await categoryService.reorder(items);
      return apiResponse(res, { reordered: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
