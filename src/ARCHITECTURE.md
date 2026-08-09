# CorpErgo — Project Architecture

Feature-based layout for TanStack Start + file-based routing. **Routes stay thin**; business UI lives under `features/`; cross-portal primitives live under `shared/`.

## Directory map

```
src/
├── routes/              # TanStack Router only — URL → page component (keep <100 lines)
│   ├── __root.tsx       # App shell, QueryClient, global CSS
│   ├── index.tsx        # / → LandingPage
│   ├── login.tsx        # Redirect shim → /?login=true
│   ├── signup.tsx       # Patient registration
│   ├── direct-booking.tsx
│   ├── patient.tsx      # Patient portal layout + auth guard
│   ├── patient/         # Patient routes
│   ├── physio.tsx       # Physio portal layout
│   ├── physio/          # Physio routes
│   ├── admin.tsx        # Admin portal layout
│   └── admin/           # Admin routes
│
├── features/            # Domain modules (UI + config per portal/product area)
│   ├── landing/         # Public marketing site
│   │   ├── LandingPage.tsx
│   │   ├── components/  # Section components (split target)
│   │   └── constants/
│   ├── auth/            # Login modal, auth UI
│   ├── patient/         # Patient-only UI + portal nav config
│   ├── physio/          # Physio workspace, booking, assessments UI
│   ├── admin/           # Admin dashboard components
│   └── booking/         # Shared direct-booking UI (future)
│
├── shared/              # Reused across portals
│   ├── components/
│   │   ├── layout/      # PortalShell, EmptyState, StatusBadge, …
│   │   ├── ui/          # Design system (button, dialog, calendar, …)
│   │   ├── brand/       # CorpErgoLogo
│   │   └── icons/       # BrandIcons
│   └── hooks/           # use-portal-guard
│
├── lib/                 # Data layer (Supabase REST, no React)
│   ├── auth/            # Session, profile, roles
│   ├── core/            # utils, supabase-config, error helpers
│   ├── patient/         # clinic-data, patient-intake
│   ├── physio/          # physio-data, assessments, workspace
│   ├── admin/           # dashboard metrics, clinic payments
│   └── booking/         # direct + instant booking leads
│
├── assets/              # Static images (webp)
├── styles.css           # Global styles + tokens usage
└── colors.css           # Design tokens
```

## Portal boundaries

| Portal   | Layout route      | Role guard prefix | Default redirect        |
|----------|-------------------|-------------------|-------------------------|
| Public   | —                 | —                 | `/`                     |
| Patient  | `routes/patient.tsx` | `/patient`     | `/patient/dashboard`    |
| Physio   | `routes/physio.tsx`  | `/physio`      | `/physio/dashboard`     |
| Admin    | `routes/admin.tsx`   | `/admin`       | `/admin/dashboard`      |

Auth is enforced by `shared/hooks/use-portal-guard.tsx` + `lib/auth`. Do not scatter role checks in leaf routes.

## Conventions

1. **Routes** export `Route = createFileRoute(...)` and a thin page/layout component.
2. **Features** own portal-specific components; import shared layout from `@/shared/...`.
3. **Lib** functions are pure async/data — no JSX, no hooks.
4. **Imports** use `@/` alias. Prefer feature paths over legacy re-exports in `lib/*.ts` shims.
5. **Large files** — split by section (landing), by workflow step (booking), or by panel (admin KPIs).

## Route reference

| URL | Route file | Feature entry |
|-----|------------|---------------|
| `/` | `routes/index.tsx` | `@/features/landing/LandingPage` |
| `/direct-booking` | `routes/direct-booking.tsx` | inline page |
| `/signup` | `routes/signup.tsx` | inline page |
| `/patient/*` | `routes/patient/*` | patient feature + shared portal |
| `/physio/*` | `routes/physio/*` | physio feature + shared portal |
| `/admin/dashboard` | `routes/admin/dashboard.tsx` | `@/features/admin/components/AdminCommandCenter` |

## Next split targets (by size)

- `features/landing/LandingPage.tsx` → `components/sections/*`
- `features/admin/components/AdminCommandCenter.tsx` → dashboard panels
- `routes/physio/requests.tsx` → `features/physio/components/requests/*`
- `features/patient/components/profile/PremiumPatientProfile.tsx` → form sections
- `routes/patient/book.tsx` → booking step components
