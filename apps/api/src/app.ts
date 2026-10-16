import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { marketplaceRouter } from "./routes/marketplace.js";
import { paymentsRouter } from "./routes/payments.js";
import { logisticsRouter } from "./routes/logistics.js";
import { storageRouter } from "./routes/storage.js";
import { loansRouter } from "./routes/loans.js";
import { savingsRouter } from "./routes/savings.js";
import { adminRouter } from "./routes/admin.js";
import { notifyRouter, aiRouter, rewardsRouter } from "./routes/misc.js";
import { supportRouter } from "./routes/support.js";
import { insightsRouter } from "./routes/insights.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false, hidePoweredBy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: 300,
      validate: false,
      keyGenerator: (req) => {
        const xff = req.headers["x-forwarded-for"];
        if (typeof xff === "string") return xff.split(",")[0].trim();
        if (Array.isArray(xff) && xff[0]) return xff[0].split(",")[0].trim();
        return (req.socket && req.socket.remoteAddress) || "127.0.0.1";
      },
    })
  );
  app.use("/uploads", express.static(config.uploadDir));

  app.get(["/health", "/api/health", "/ping", "/api/ping"], (_req, res) => {
    res.json({ ok: true, service: "cahs-api", prototype: true, version: "2.0.0", time: new Date().toISOString() });
  });

  const openapiPath = path.join(here, "openapi.yaml");
  if (fs.existsSync(openapiPath)) {
    const doc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));
    app.use(["/api/docs", "/docs"], swaggerUi.serve, swaggerUi.setup(doc));
    app.get(["/api/openapi.json", "/openapi.json"], (_req, res) => res.json(doc));
  }

  const subRouters: [string, express.Router][] = [
    ["/auth", authRouter],
    ["/users", usersRouter],
    ["/payments", paymentsRouter],
    ["/logistics", logisticsRouter],
    ["/storage", storageRouter],
    ["/loans", loansRouter],
    ["/savings", savingsRouter],
    ["/admin", adminRouter],
    ["/notifications", notifyRouter],
    ["/ai", aiRouter],
    ["/rewards", rewardsRouter],
    ["/support", supportRouter],
    ["/insights", insightsRouter],
  ];

  for (const [prefix, router] of subRouters) {
    app.use(`/api${prefix}`, router);
    app.use(prefix, router);
  }

  app.use("/api", marketplaceRouter);
  app.use("/", marketplaceRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("API error:", err);
    res.status(500).json({ error: err.message || "Unexpected server error" });
  });
  return app;
}

let singletonApp: any = null;
export default function handler(req: any, res: any) {
  if (!singletonApp) singletonApp = createApp();
  return singletonApp(req, res);
}
