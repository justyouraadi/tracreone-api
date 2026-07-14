import { Router, type IRouter } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { validateBody } from "../../lib/validate";
import { z } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import type { Response } from "express";
import { placeAiCall, handleAiCallingWebhook, aiCallingStatus } from "./service";

const router: IRouter = Router();

const placeCallSchema = z.object({
  leadId: z.number().int(),
  toPhoneNumber: z.string().min(5),
  script: z.string().optional(),
});

router.get("/status", requireAuth, (_req, res) => res.json(aiCallingStatus()));

router.post(
  "/calls",
  requireAuth,
  requireCompanyScope,
  validateBody(placeCallSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await placeAiCall({ ...req.body, companyId: req.auth!.companyId });
    res.status(202).json({ call: result });
  }),
);

// Webhook from the AI calling vendor — no auth (vendor calls this directly).
// Once a real vendor is configured, add signature verification here.
router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const event = await handleAiCallingWebhook(req.body);
    res.json({ received: true, event });
  }),
);

export default router;
