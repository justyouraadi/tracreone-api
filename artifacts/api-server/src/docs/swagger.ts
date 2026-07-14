import { Router, type IRouter } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";

export const swaggerRouter: IRouter = Router();

swaggerRouter.use("/", swaggerUi.serve, swaggerUi.setup(openApiDocument));
