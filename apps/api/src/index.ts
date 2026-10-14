import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";

try {
  fs.mkdirSync(config.uploadDir, { recursive: true });
} catch (err) {
  console.warn("Could not create upload directory:", err);
}

const app = createApp();

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`CAHS API listening on :${config.port} (Africa/Lagos). Prototype — simulated funds only.`);
  });
}

export default app;
