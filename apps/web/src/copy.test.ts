import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

describe("honesty copy", () => {
  it("keeps prototype and concept banners in the shell", () => {
    const shell = readFileSync(path.join(root, "shell.tsx"), "utf8");
    expect(shell).toContain("Prototype: simulated payments, loans and savings. No real funds are handled.");
    expect(shell).toContain("Concept proposal. Subject to validation, approvals and partnership agreements.");
  });
});
