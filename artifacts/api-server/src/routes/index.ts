import { Router, type IRouter } from "express";
import healthRouter from "./health";
import v1Router from "./v1";
import { swaggerRouter } from "../docs/swagger";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/docs", swaggerRouter);
router.use("/v1", v1Router);

export default router;
