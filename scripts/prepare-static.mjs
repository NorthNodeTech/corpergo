/**
 * Flatten TanStack Start SPA client output so Render can publish `dist`
 * with index.html at the root (Build: npm install && npm run build).
 *
 * Also writes SPA shells under each known app path so hard navigations
 * (/login after sign-out, refresh on /physio/scan, etc.) do not 404 on
 * static hosts that lack a catch-all rewrite.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const clientDir = join(root, "dist", "client");
const distDir = join(root, "dist");
const indexPath = join(clientDir, "index.html");

/** Known app routes (no dynamic segments) — each gets a copied SPA shell. */
const SPA_SHELL_PATHS = [
  "/login",
  "/signup",
  "/admin",
  "/admin/dashboard",
  "/patient",
  "/patient/dashboard",
  "/patient/appointments",
  "/patient/book",
  "/patient/profile",
  "/patient/qr-ticket",
  "/patient/reports",
  "/patient/settings",
  "/physio",
  "/physio/dashboard",
  "/physio/queue",
  "/physio/requests",
  "/physio/scan",
  "/physio/assessments",
];

if (!existsSync(indexPath)) {
  console.error(
    "[prepare-static] Missing dist/client/index.html. SPA prerender did not produce an entry page.",
  );
  process.exit(1);
}

// Copy every file/folder from dist/client into dist/ so publish dir = dist works
for (const name of readdirSync(clientDir)) {
  const from = join(clientDir, name);
  const to = join(distDir, name);
  if (existsSync(to)) {
    rmSync(to, { recursive: true, force: true });
  }
  cpSync(from, to, { recursive: true });
}

const shellSource = join(distDir, "index.html");
if (!existsSync(shellSource)) {
  console.error("[prepare-static] Failed to place index.html in dist/");
  process.exit(1);
}

// SPA shells for deep links / hard navigations (sign-out → /login)
let shells = 0;
for (const routePath of SPA_SHELL_PATHS) {
  const target = join(distDir, routePath.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  cpSync(shellSource, target);
  shells += 1;
}

// Some CDNs use 404.html as a soft SPA fallback
cpSync(shellSource, join(distDir, "404.html"));

writeFileSync(join(distDir, "_redirects"), "/*    /index.html   200\n");

console.log(
  `[prepare-static] Ready: publish directory dist/ (index.html + ${shells} route shells + 404.html)`,
);
