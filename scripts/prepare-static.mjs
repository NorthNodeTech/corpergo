/**
 * Flatten TanStack Start SPA client output for CDN hosts (Render, Netlify, etc.).
 * Vite/TanStack writes to dist/client; hosts often expect a top-level folder with index.html.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const clientDir = join(root, "dist", "client");
const buildDir = join(root, "build");
const indexPath = join(clientDir, "index.html");

if (!existsSync(indexPath)) {
  console.error(
    "[prepare-static] Missing dist/client/index.html. SPA prerender did not produce an entry page.",
  );
  process.exit(1);
}

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
cpSync(clientDir, buildDir, { recursive: true });

// Ensure SPA fallback exists for hosts that honor Netlify-style _redirects
writeFileSync(join(buildDir, "_redirects"), "/*    /index.html   200\n");

console.log("[prepare-static] Published static site ready at ./build");
