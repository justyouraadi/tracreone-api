import { Router, type IRouter } from "express";
import * as controller from "./auth.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { authRateLimiter } from "../../middlewares/rateLimit";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  otpRequestSchema,
  otpVerifySchema,
} from "./auth.schema";

const router: IRouter = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), asyncHandler(controller.register));
router.post("/login", authRateLimiter, validateBody(loginSchema), asyncHandler(controller.login));
router.post("/refresh", authRateLimiter, validateBody(refreshSchema), asyncHandler(controller.refresh));
router.post("/logout", validateBody(refreshSchema), asyncHandler(controller.logout));
router.post("/otp/request", authRateLimiter, validateBody(otpRequestSchema), asyncHandler(controller.requestOtp));
router.post("/otp/verify", authRateLimiter, validateBody(otpVerifySchema), asyncHandler(controller.verifyOtp));
router.get("/me", requireAuth, asyncHandler(controller.me));

export default router;
