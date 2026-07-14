import { Router, type IRouter } from "express";
import * as controller from "./upload.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { requestUploadUrlSchema, confirmUploadSchema } from "./upload.schema";

const router: IRouter = Router();

// Public asset serving — no auth, matches object-storage skill convention.
router.get("/public-objects/*filePath", asyncHandler(controller.servePublicObject));

router.use(requireAuth, requireCompanyScope);

router.post("/uploads/request-url", validateBody(requestUploadUrlSchema), asyncHandler(controller.requestUploadUrl));
router.post("/uploads/confirm", validateBody(confirmUploadSchema), asyncHandler(controller.confirmUpload));
router.get("/uploads", asyncHandler(controller.listUploads));
router.delete("/uploads/:id", asyncHandler(controller.deleteUpload));
router.get("/objects/*path", asyncHandler(controller.serveObject));

export default router;
