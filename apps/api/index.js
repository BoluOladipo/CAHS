let cachedApp = null;

export default async function handler(req, res) {
  if (req.url === "/api/ping" || req.url === "/ping" || req.url?.endsWith("/ping")) {
    return res.status(200).json({ ping: "pong from apps/api", ver: "1.0", url: req.url });
  }
  try {
    if (!cachedApp) {
      const { createApp } = await import("./dist/app.js");
      cachedApp = createApp();
    }
    return cachedApp(req, res);
  } catch (err) {
    console.error("Vercel API handler error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || String(err),
      stack: err.stack,
      name: err.name,
      service: "cahs-api",
    });
  }
}
