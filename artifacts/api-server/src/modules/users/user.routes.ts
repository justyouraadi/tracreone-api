import { Router, type IRouter } from "express";
import * as controller from "./user.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireRole, requireCompanyScope } from "../../middlewares/rbac";
import { createUserSchema, updateUserSchema } from "./user.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.listUsers));
router.post("/", requireRole("owner", "admin"), validateBody(createUserSchema), asyncHandler(controller.createUser));
router.get("/:id", asyncHandler(controller.getUser));
router.patch("/:id", requireRole("owner", "admin"), validateBody(updateUserSchema), asyncHandler(controller.updateUser));
router.delete("/:id", requireRole("owner", "admin"), asyncHandler(controller.deleteUser));

export default router;
