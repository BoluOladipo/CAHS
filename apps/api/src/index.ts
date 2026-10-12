import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";

fs.mkdirSync(config.uploadDir, { recursive: true });
const app = createApp();
app.listen(config.port, () => {
  console.log(`CAHS API listening on :${config.port} (Africa/Lagos). Prototype — simulated funds only.`);
});
