/**
 * Flatten TanStack Start SPA client output for Render Static Site.
 *
 * Supports either Publish Directory:
 *   - dist  (preferred: npm install && npm run build → dist)
 *   - build (legacy dashboard setting)
 *
 * Also writes SPA shells under known routes so hard navigations
 * (sign-out → /login, refresh on /physio/scan) do not 404.
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
const buildDir = join(root, "build");
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

// 1) Copy client build into dist/ root so Publish Directory = dist works
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

function writeSpaShells(targetRoot) {
  let shells = 0;
  for (const routePath of SPA_SHELL_PATHS) {
    const target = join(targetRoot, routePath.replace(/^\//, ""), "index.html");
    mkdirSync(dirname(target), { recursive: true });
    cpSync(shellSource, target);
    shells += 1;
  }
  cpSync(shellSource, join(targetRoot, "404.html"));
  writeFileSync(join(targetRoot, "_redirects"), "/*    /index.html   200\n");
  return shells;
}

const shells = writeSpaShells(distDir);

// 2) Also create clean ./build for dashboards still set to Publish Directory = build
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });

// Copy only static publishables (not dist/server)
for (const name of ["index.html", "assets", "favicon.ico", "favicon.png", "_redirects", "404.html"]) {
  const from = join(distDir, name);
  if (!existsSync(from)) continue;
  cpSync(from, join(buildDir, name), { recursive: true });
}
writeSpaShells(buildDir);

console.log(
  `[prepare-static] Ready: dist/ and build/ (index.html + ${shells} route shells). Use Publish Directory "dist" or "build".`,
);
