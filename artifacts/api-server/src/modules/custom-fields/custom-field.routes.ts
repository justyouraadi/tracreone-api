import { Router, type IRouter } from "express";
import * as controller from "./custom-field.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import { createCustomFieldSchema, updateCustomFieldSchema, setCustomFieldValueSchema } from "./custom-field.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", asyncHandler(controller.listCustomFields));
router.post("/", validateBody(createCustomFieldSchema), asyncHandler(controller.createCustomField));
router.patch("/:id", validateBody(updateCustomFieldSchema), asyncHandler(controller.updateCustomField));
router.delete("/:id", asyncHandler(controller.deleteCustomField));

router.get("/leads/:leadId/values", asyncHandler(controller.getLeadCustomFieldValues));
router.put("/leads/:leadId/values", validateBody(setCustomFieldValueSchema), asyncHandler(controller.setLeadCustomFieldValue));

export default router;
