import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const port = process.env.PORT || "3000";

if (!existsSync(join(distDir, "index.html"))) {
  console.error("[serve-static] Missing dist/index.html. Run npm run build first.");
  process.exit(1);
}

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["serve", "-s", "dist", "-l", `tcp://0.0.0.0:${port}`],
  { stdio: "inherit", shell: process.platform === "win32" },
);

child.on("exit", (code) => process.exit(code ?? 0));
