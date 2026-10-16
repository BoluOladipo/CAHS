import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";
try {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}
catch (err) {
    // directory creation error is non-fatal
}
const app = createApp();
const port = Number(process.env.PORT || config.port || 4000);
try {
    app.listen(port, "0.0.0.0", () => {
        console.log(`CAHS API server listening on 0.0.0.0:${port}`);
    });
}
catch (err) {
    console.warn("Server listen note:", err.message);
}
export default app;
