import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";

try {
  fs.mkdirSync(config.uploadDir, { recursive: true });
} catch (err) {
  // directory creation error is non-fatal
}

const app = createApp();

const port = Number(process.env.PORT ?? config.port ?? 4000);
if (port && !process.env.VERCEL_SERVERLESS) {
  try {
    app.listen(port, "0.0.0.0", () => {
      console.log(`CAHS API listening on :${port} (Africa/Lagos). Prototype — simulated funds only.`);
    });
  } catch (err) {
    console.warn("Server listen note:", (err as Error).message);
  }
}

export default app;
