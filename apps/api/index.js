let cachedApp = null;

export default async function handler(req, res) {
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
