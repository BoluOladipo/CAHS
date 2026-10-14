import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";
try {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}
catch (err) {
    console.warn("Could not create upload directory:", err);
}
const app = createApp();
if (!process.env.VERCEL) {
    const port = Number(process.env.PORT ?? config.port ?? 4000);
    app.listen(port, () => {
        console.log(`CAHS API listening on :${port} (Africa/Lagos). Prototype — simulated funds only.`);
    });
}
export default function handler(req, res) {
    if (req.url === "/api/ping" || req.url === "/ping" || req.url?.endsWith("/ping")) {
        return res.status(200).json({ ping: "pong from src/index.ts", ver: "1.0", url: req.url });
    }
    try {
        return app(req, res);
    }
    catch (err) {
        return res.status(500).json({
            ok: false,
            error: err?.message || String(err),
            stack: err?.stack,
            service: "cahs-api",
        });
    }
}
