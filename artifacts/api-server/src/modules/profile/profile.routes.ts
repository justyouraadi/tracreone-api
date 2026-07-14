import { Router, type IRouter } from "express";
import * as controller from "./profile.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { updateProfileSchema, changePasswordSchema } from "./profile.schema";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", asyncHandler(controller.getProfile));
router.patch("/", validateBody(updateProfileSchema), asyncHandler(controller.updateProfile));
router.post("/change-password", validateBody(changePasswordSchema), asyncHandler(controller.changePassword));

export default router;
