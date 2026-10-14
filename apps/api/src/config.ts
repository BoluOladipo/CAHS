import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../../../.env") });
dotenv.config({ path: path.resolve(here, "../.env") });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  jwtAccess: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me-32chars",
  jwtRefresh: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me-32chars",
  fieldKey: process.env.FIELD_ENCRYPTION_KEY ?? "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  uploadDir: process.env.UPLOAD_DIR ?? (process.env.VERCEL ? "/tmp/uploads" : path.resolve(here, "../uploads")),
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  tz: process.env.TZ ?? "Africa/Lagos",
  smtp: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_SECURE ?? "true") === "true" || process.env.SMTP_PORT === "465",
    user: process.env.SMTP_USER ?? "",
    pass: (process.env.SMTP_PASS ?? "").replace(/\s+/g, ""),
    from: process.env.SMTP_FROM ?? '"Centralized Agro Hub (CAHS)" <boluoladipocodes@gmail.com>',
  },
};
