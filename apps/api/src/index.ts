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

export default app;
