import "dotenv/config";

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export const env = {
  node: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  databaseUrl: req("DATABASE_URL", "postgresql://cahs:cahs@localhost:5432/cahs?schema=public"),
  jwtAccess: req("JWT_ACCESS_SECRET", "dev-access-secret-min-32-characters-ok"),
  jwtRefresh: req("JWT_REFRESH_SECRET", "dev-refresh-secret-min-32-characters-ok"),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  fieldKey: req(
    "FIELD_ENCRYPTION_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  ),
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
};
