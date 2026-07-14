import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Body-parser errors (raised before any route runs): map to proper client
  // errors instead of a generic 500.
  if (err && typeof err === "object" && "type" in err) {
    if (err.type === "entity.too.large") {
      res.status(413).json({ error: "Request body too large" });
      return;
    }
    if (err.type === "entity.parse.failed") {
      res.status(400).json({ error: "Malformed JSON in request body" });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "A record with these values already exists" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return;
    }
  }

  req.log?.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
};
