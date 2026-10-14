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
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json({ limit: "2mb" }));
    app.use(rateLimit({ windowMs: 60_000, max: 300 }));
    app.use("/uploads", express.static(config.uploadDir));
    app.get(["/health", "/api/health"], (_req, res) => {
        res.json({ ok: true, service: "cahs-api", prototype: true });
    });
    const openapiPath = path.join(here, "openapi.yaml");
    if (fs.existsSync(openapiPath)) {
        const doc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));
        app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(doc));
        app.get("/api/openapi.json", (_req, res) => res.json(doc));
    }
    app.use("/api/auth", authRouter);
    app.use("/api/users", usersRouter);
    app.use("/api", marketplaceRouter);
    app.use("/api/payments", paymentsRouter);
    app.use("/api/logistics", logisticsRouter);
    app.use("/api/storage", storageRouter);
    app.use("/api/loans", loansRouter);
    app.use("/api/savings", savingsRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/notifications", notifyRouter);
    app.use("/api/ai", aiRouter);
    app.use("/api/rewards", rewardsRouter);
    app.use("/api/support", supportRouter);
    app.use("/api/insights", insightsRouter);
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: "Unexpected server error" });
    });
    return app;
}
const defaultApp = createApp();
export default defaultApp;
