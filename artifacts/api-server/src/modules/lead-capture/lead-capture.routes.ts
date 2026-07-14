import { Router, type IRouter } from "express";
import * as controller from "./lead-capture.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { publicCaptureRateLimiter } from "../../middlewares/rateLimit";
import { captureLeadSchema } from "./lead-capture.schema";

const router: IRouter = Router();

router.post("/", publicCaptureRateLimiter, validateBody(captureLeadSchema), asyncHandler(controller.captureLead));

export default router;
