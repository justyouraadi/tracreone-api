import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { errorHandler } from "./middlewares/errorHandler";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  helmet({
    // The API is consumed by a native Android client, not a browser, and
    // serves file downloads from object storage — a strict default CSP
    // would only add friction with no security benefit here.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
// CORS is intentionally open: this API has no browser-based first-party
// client (the consumer is the Android app, which is not subject to CORS),
// and public endpoints (lead capture, landing page slugs) must be
// reachable from arbitrary third-party marketing sites embedding forms.
// Authenticated routes remain protected by JWT bearer auth regardless of
// origin.
app.use(cors());
// Explicit body-size caps: large enough for landing-page JSON blobs, small
// enough to prevent memory-exhaustion via oversized payloads.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;
