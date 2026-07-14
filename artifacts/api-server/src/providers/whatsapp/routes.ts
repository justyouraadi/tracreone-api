import { Router, type IRouter } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { validateBody } from "../../lib/validate";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import type { Response } from "express";
import { sendWhatsAppMessage, receiveWhatsAppWebhook, whatsAppStatus } from "./service";
import { whatsAppConfig } from "./config";

const router: IRouter = Router();

const sendMessageSchema = z.object({
  toPhoneNumber: z.string().min(5),
  body: z.string().min(1),
  templateName: z.string().optional(),
  leadId: z.number().int().optional(),
});

router.get("/status", requireAuth, (_req, res) => res.json(whatsAppStatus()));

router.post(
  "/messages",
  requireAuth,
  requireCompanyScope,
  validateBody(sendMessageSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await sendWhatsAppMessage({ ...req.body, companyId: req.auth!.companyId });
    res.status(202).json({ message: result });
  }),
);

// WhatsApp Business API webhook verification handshake (Meta Cloud API style).
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === whatsAppConfig.webhookVerifyToken && whatsAppConfig.webhookVerifyToken) {
    res.status(200).send(challenge);
    return;
  }
  res.status(403).send("Verification failed");
});

router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const event = await receiveWhatsAppWebhook(req.body);
    res.json({ received: true, event });
  }),
);

export default router;
