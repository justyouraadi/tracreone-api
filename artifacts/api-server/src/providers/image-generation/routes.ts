import { Router, type IRouter } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { validateBody } from "../../lib/validate";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import type { Response } from "express";
import { generatePoster, imageGenerationStatus } from "./service";

const router: IRouter = Router();

const generatePosterSchema = z.object({
  prompt: z.string().min(1),
  landingPageId: z.number().int().optional(),
  templateStyle: z.string().optional(),
});

router.get("/status", requireAuth, (_req, res) => res.json(imageGenerationStatus()));

router.post(
  "/posters",
  requireAuth,
  requireCompanyScope,
  validateBody(generatePosterSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await generatePoster({ ...req.body, companyId: req.auth!.companyId });
    res.status(202).json({ poster: result });
  }),
);

export default router;
