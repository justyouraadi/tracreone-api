import { Router, type IRouter } from "express";
import * as controller from "./lead.controller";
import { asyncHandler } from "../../lib/asyncHandler";
import { validateBody, validateQuery } from "../../lib/validate";
import { requireAuth } from "../../middlewares/auth";
import { requireCompanyScope } from "../../middlewares/rbac";
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  createNoteSchema,
  attachTagSchema,
  listLeadsQuerySchema,
} from "./lead.schema";

const router: IRouter = Router();

router.use(requireAuth, requireCompanyScope);

router.get("/", validateQuery(listLeadsQuerySchema), asyncHandler(controller.listLeads));
router.post("/", validateBody(createLeadSchema), asyncHandler(controller.createLead));
router.get("/:id", asyncHandler(controller.getLead));
router.patch("/:id", validateBody(updateLeadSchema), asyncHandler(controller.updateLead));
router.delete("/:id", asyncHandler(controller.deleteLead));
router.post("/:id/assign", validateBody(assignLeadSchema), asyncHandler(controller.assignLead));
router.post("/:id/notes", validateBody(createNoteSchema), asyncHandler(controller.addNote));
router.post("/:id/tags", validateBody(attachTagSchema), asyncHandler(controller.attachTag));
router.delete("/:id/tags/:tagId", asyncHandler(controller.detachTag));

export default router;
