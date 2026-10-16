import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";

try {
  fs.mkdirSync(config.uploadDir, { recursive: true });
} catch (err) {
  // non-fatal
}

const app = createApp();

if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  const port = Number(process.env.PORT || config.port || 4000);
  try {
    app.listen(port, "0.0.0.0", () => {
      console.log(`CAHS API listening on :${port}`);
    });
  } catch (err) {
    // non-fatal
  }
}

export default async function handler(req: any, res: any) {
  // Defensive CORS headers for preflight and all responses
  const origin = req.headers?.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.url === "/api/ping" || req.url === "/ping") {
    return res.status(200).json({ ok: true, ping: "pong", time: new Date().toISOString() });
  }

  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    res.on("error", (err: any) => {
      console.error("Response stream error:", err);
      resolve();
    });

    try {
      app(req, res, (err: any) => {
        if (err) {
          console.error("Unhandled express route error:", err);
          if (!res.headersSent) {
            res.status(500).json({ ok: false, error: err?.message || String(err) });
          }
        }
        resolve();
      });
    } catch (syncErr: any) {
      console.error("Synchronous handler error:", syncErr);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: syncErr?.message || String(syncErr) });
      }
      resolve();
    }
  });
}
