# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory defines a route.

> **Architecture:** Keep route files thin. Page UI belongs in `src/features/`; shared layout in `src/shared/`. See `src/ARCHITECTURE.md`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic) |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

Portal layouts: `patient.tsx`, `physio.tsx`, `admin.tsx` — auth guard + `PortalShell`.

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.
