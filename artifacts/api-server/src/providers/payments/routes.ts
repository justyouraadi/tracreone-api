import { Router, type IRouter } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { requireRole } from "../../middlewares/rbac";
import { validateBody } from "../../lib/validate";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import type { Response } from "express";
import { createSubscriptionOrder, handlePaymentsWebhook, paymentsStatus } from "./service";

const router: IRouter = Router();

const createOrderSchema = z.object({
  planId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
});

router.get("/status", requireAuth, (_req, res) => res.json(paymentsStatus()));

router.post(
  "/subscriptions/order",
  requireAuth,
  requireCompanyScope,
  requireRole("owner", "admin"),
  validateBody(createOrderSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const order = await createSubscriptionOrder({ ...req.body, companyId: req.auth!.companyId! });
    res.status(201).json({ order });
  }),
);

// Payment gateway webhook — no auth (gateway calls this directly);
// signature verification happens inside the concrete provider once configured.
router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const signature = req.headers["x-webhook-signature"] as string | undefined;
    const event = await handlePaymentsWebhook(JSON.stringify(req.body), signature);
    res.json({ received: true, event });
  }),
);

export default router;
