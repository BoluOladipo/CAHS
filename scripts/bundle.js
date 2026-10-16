import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

const banner = `import { createRequire } from 'module'; import { fileURLToPath as _fileURLToPath } from 'url'; import _path from 'path'; const require = createRequire(import.meta.url); const __filename = _fileURLToPath(import.meta.url); const __dirname = _path.dirname(__filename);`;

const targets = [
  path.resolve(repoRoot, "apps/api/index.js"),
  path.resolve(repoRoot, "apps/api/dist/index.js"),
  path.resolve(repoRoot, "api/index.js"),
];

const entryPoint = path.resolve(repoRoot, "apps/api/src/index.ts");

async function run() {
  for (const outfile of targets) {
    await build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: "node",
      target: "node20",
      format: "esm",
      banner: {
        js: banner,
      },
      outfile,
    });
    console.log(`[bundle] Generated ${outfile}`);
  }
}

run().catch((err) => {
  console.error("[bundle] Build error:", err);
  process.exit(1);
});
