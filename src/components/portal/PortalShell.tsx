import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, LogOut, Settings, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import logoImg from "@/assets/LOGO.webp";
import { clearSession } from "@/lib/auth";

export type PortalNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shorter label for footer tabs */
  shortLabel?: string;
  /** In-page section hash (e.g. admin dashboard anchors) */
  hash?: string;
};

export type PortalCenterAction = {
  to: string;
  label: string;
  icon: LucideIcon;
  hash?: string;
  /** Prefer button action over navigation (e.g. open admin alerts) */
  onClick?: () => void;
};

function initialsFromName(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function pathMatches(pathname: string, to: string) {
  if (pathname === to) return true;
  if (to.endsWith("/dashboard")) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function AccountMenu({
  userName,
  settingsTo,
}: {
  userName?: string;
  settingsTo?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function signOut() {
    clearSession();
    setOpen(false);
    // Client-side navigate — never window.location (that 404s on static hosts without /login file)
    void navigate({ to: "/login", replace: true });
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = userName?.trim() || "Account";

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        className="group flex max-w-[12rem] items-center gap-2 rounded-full border border-[var(--border)] bg-white text-[var(--ink)] py-1.5 pl-1.5 pr-2.5 shadow-sm sm:max-w-[16rem] hover:bg-[var(--muted)] transition-colors"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--structure-maroon)] text-xs font-bold text-white shadow-sm">
          {initialsFromName(userName)}
        </span>
        <span className="hidden min-w-0 truncate text-sm font-semibold text-[var(--ink)] sm:block">
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--ink-soft)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-56 overflow-hidden rounded-2xl border border-black/[0.08] bg-white py-1.5 shadow-[0_12px_32px_rgba(38,50,56,0.16)]"
          >
            <div className="border-b border-black/[0.06] px-3.5 py-3">
              <div className="truncate text-sm font-bold text-[var(--ink)]">{label}</div>
              <div className="mt-0.5 text-xs text-[var(--ink-soft)]">Signed in</div>
            </div>

            {settingsTo ? (
              <Link
                to={settingsTo}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--ivory)] hover:text-[var(--ink)]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            ) : null}

            <div className="my-1 border-t border-black/[0.06]" />

            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GlassFooterNav({
  items,
  centerAction,
  layoutKey,
}: {
  items: PortalNavItem[];
  centerAction?: PortalCenterAction;
  layoutKey: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });
  const { scrollY } = useScroll();
  const dockY = useTransform(scrollY, [0, 100], [0, 4]);
  const dockScale = useTransform(scrollY, [0, 100], [1, 0.98]);

  const activeKey = useMemo(() => {
    const withHash = items.filter((item) => item.hash);
    if (hash) {
      const match = withHash.find((item) => `#${item.hash}` === hash || item.hash === hash.replace(/^#/, ""));
      if (match) return `${match.to}#${match.hash}`;
    }
    // Overview / no-hash tabs: active when path matches and no section hash
    const matches = items.filter((item) => !item.hash && pathMatches(pathname, item.to));
    if (matches.length === 0) {
      // Fallback: path-only match including hashed items' base path
      const pathMatchesItems = items.filter((item) => pathMatches(pathname, item.to));
      if (pathMatchesItems.length && !hash) {
        const bare = pathMatchesItems.find((i) => !i.hash);
        if (bare) return bare.to;
      }
      return null;
    }
    return matches.sort((a, b) => b.to.length - a.to.length)[0]?.to ?? null;
  }, [items, pathname, hash]);

  const centerActive = Boolean(
    centerAction &&
      (centerAction.hash
        ? hash === `#${centerAction.hash}` || hash === centerAction.hash
        : pathMatches(pathname, centerAction.to) && !hash),
  );
  const CenterIcon = centerAction?.icon;
  const mid = Math.ceil(items.length / 2);
  const left = centerAction ? items.slice(0, mid) : items;
  const right = centerAction ? items.slice(mid) : [];

  const Tab = ({ item }: { item: PortalNavItem }) => {
    const key = item.hash ? `${item.to}#${item.hash}` : item.to;
    const active = activeKey === key && !centerActive;
    const Icon = item.icon;
    return (
      <Link
        to={item.to}
        hash={item.hash}
        aria-current={active ? "page" : undefined}
        className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-1"
        onClick={() => {
          if (!item.hash) return;
          // Smooth scroll after navigation settles
          requestAnimationFrame(() => {
            const el = document.getElementById(item.hash!);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
      >
        <motion.div
          whileTap={{ scale: 0.88, y: 2 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className="relative flex w-full max-w-[4.5rem] flex-col items-center justify-center gap-0.5"
        >
          <div className="relative grid h-10 w-full place-items-center">
            {active ? (
              <motion.span
                layoutId={`portal-tab-pill-${layoutKey}`}
                className="absolute inset-x-1 inset-y-0 rounded-2xl bg-black/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]"
                transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.8 }}
              />
            ) : null}
            <motion.div
              animate={{ 
                scale: active ? 1.05 : 1,
                color: active ? "#000000" : "var(--ink-soft)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="relative z-[1] flex items-center justify-center"
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
            </motion.div>
          </div>
          <motion.span
            animate={{
              color: active ? "#000000" : "var(--ink-soft)"
            }}
            transition={{ duration: 0.2 }}
            className={`relative z-[1] max-w-full truncate text-[10px] tracking-wide ${active ? "font-bold" : "font-semibold"}`}
          >
            {item.shortLabel || item.label}
          </motion.span>
        </motion.div>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 lg:hidden"
    >
      <motion.div style={{ y: dockY, scale: dockScale }} className="pointer-events-auto mx-auto max-w-lg">
        <div className="portal-glass-dock relative flex items-end gap-0.5 rounded-[32px] px-1.5 pb-2 pt-2">
          {left.map((item) => (
            <Tab key={item.hash ? `${item.to}#${item.hash}` : item.to} item={item} />
          ))}

          {centerAction ? (
            <div className="relative flex w-[4.75rem] shrink-0 flex-col items-center justify-end">
              {centerAction.onClick ? (
                <button
                  type="button"
                  aria-label={centerAction.label}
                  onClick={centerAction.onClick}
                  className="group relative -mt-8 mb-0.5"
                >
                  <motion.span
                    whileTap={{ scale: 0.88, y: 4 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className={`relative grid h-[3.85rem] w-[3.85rem] place-items-center rounded-full text-white shadow-[0_12px_32px_rgba(71,86,63,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] ring-[4px] ring-white/60 backdrop-blur-md ${
                      centerActive
                        ? "bg-black"
                        : "bg-black"
                    }`}
                  >
                    <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 transition-opacity group-hover:opacity-100" />
                    {CenterIcon ? (
                      <CenterIcon className="relative z-[1] h-7 w-7" strokeWidth={2.25} />
                    ) : null}
                  </motion.span>
                </button>
              ) : (
                <Link
                  to={centerAction.to}
                  hash={centerAction.hash}
                  aria-label={centerAction.label}
                  aria-current={centerActive ? "page" : undefined}
                  className="group relative -mt-8 mb-0.5"
                >
                  <motion.span
                    whileTap={{ scale: 0.88, y: 4 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className={`relative grid h-[3.85rem] w-[3.85rem] place-items-center rounded-full text-white shadow-[0_12px_32px_rgba(71,86,63,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)] ring-[4px] ring-white/60 backdrop-blur-md ${
                      centerActive
                        ? "bg-black"
                        : "bg-black"
                    }`}
                  >
                    <span className="absolute inset-0 rounded-full bg-white/15 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="portal-scan-pulse absolute inset-0 rounded-full" />
                    {CenterIcon ? (
                      <CenterIcon className="relative z-[1] h-7 w-7" strokeWidth={2.25} />
                    ) : null}
                  </motion.span>
                </Link>
              )}
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  centerActive ? "text-black" : "text-[var(--ink-soft)]"
                }`}
              >
                {centerAction.label}
              </span>
            </div>
          ) : null}

          {right.map((item) => (
            <Tab key={item.hash ? `${item.to}#${item.hash}` : item.to} item={item} />
          ))}
        </div>
      </motion.div>
    </nav>
  );
}

export function PortalShell({
  title,
  subtitle,
  nav,
  children,
  userName,
  footerNav,
  centerAction,
  settingsPath,
  contentClassName,
}: {
  title: string;
  subtitle: string;
  nav: PortalNavItem[];
  children: ReactNode;
  userName?: string;
  /** Bottom glass tab bar (patient / staff). When set, mobile drawer is omitted. */
  footerNav?: PortalNavItem[];
  /** PhonePe/GPay-style center action (e.g. Scan). */
  centerAction?: PortalCenterAction;
  settingsPath?: string;
  contentClassName?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const settingsTo =
    settingsPath ||
    nav.find((item) => /settings/i.test(item.label) || item.to.includes("/settings"))?.to;
  const hasFooter = Boolean(footerNav?.length);
  const layoutKey = title.replace(/\s+/g, "-").toLowerCase();

  const isDashboard = pathname.endsWith("/dashboard") || pathname.endsWith("/dashboard/");

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1.5 px-3">
      {nav.map((item) => {
        const { to, label, icon: Icon, hash } = item;
        return (
          <Link
            key={hash ? `${to}#${hash}` : `${to}-${label}`}
            to={to}
            hash={hash}
            onClick={() => {
              onNavigate?.();
              if (!hash) return;
              requestAnimationFrame(() => {
                document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
            className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-semibold text-[var(--ink-soft)] transition-colors hover:bg-black/5 hover:text-[var(--ink)] border border-transparent"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-bold bg-[var(--muted)] text-[var(--foreground)] shadow-sm border border-[var(--border)]",
            }}
            activeOptions={{ exact: to.endsWith("/dashboard") && !hash }}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="portal-shell relative min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden">
      <div className="portal-shell__glow" aria-hidden />

      <div
        className={`relative min-h-screen lg:h-screen lg:max-h-screen min-w-0 w-full max-w-full ${
          hasFooter
            ? `lg:grid ${sidebarOpen ? "lg:grid-cols-[240px_1fr]" : "lg:grid-cols-1"}`
            : `lg:grid ${sidebarOpen ? "lg:grid-cols-[260px_1fr]" : "lg:grid-cols-1"}`
        }`}
      >
        {/* Desktop sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen ? (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: hasFooter ? 240 : 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="portal-glass-sidebar sticky top-0 z-30 hidden h-screen max-h-screen shrink-0 lg:flex lg:flex-col border-r border-black/10 overflow-hidden whitespace-nowrap"
            >
              <div className="px-5 py-6 flex items-start justify-between bg-gradient-to-br from-[var(--structure-maroon)] to-[#A64B29] rounded-br-[2.5rem] shadow-md mb-2">
                <div>
                  <Link to="/" className="flex items-center gap-3">
                    <img src={logoImg} alt="CorpErgo" className="h-18 sm:h-20 w-auto object-contain drop-shadow-sm brightness-0 invert" />
                  </Link>
                  <div className="mt-4">
                    <div className="text-sm font-extrabold text-white">{title}</div>
                    <div className="mt-0.5 text-xs text-white/80">{subtitle}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-full p-1.5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pb-6">
                <NavLinks />
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <div className={`relative z-[1] flex min-h-screen lg:h-screen lg:max-h-screen min-w-0 w-full max-w-full flex-col lg:overflow-y-auto ${sidebarOpen ? "lg:col-start-2" : "lg:col-start-1"}`}>
          <header className="portal-glass-header sticky top-0 z-40 flex h-[4.25rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:block rounded-full p-2 hover:bg-black/5 text-[var(--ink-soft)] transition-colors -ml-2"
                  aria-label="Open sidebar"
                >
                  <PanelLeftOpen className="h-5 w-5" />
                </button>
              )}
              <img src={logoImg} alt="CorpErgo" className="h-16 sm:h-18 w-auto object-contain lg:hidden drop-shadow-sm brightness-100" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[var(--ink)] lg:text-[15px]">
                  {title}
                </div>
                <div className="truncate text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  {userName?.trim() || subtitle}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Show Health Profile only in Patient portal */}
              {pathname.includes("/patient") && (
                <Link
                  to="/patient/profile"
                  className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--ink-soft)] hover:bg-black/5 hover:text-black transition-colors"
                >
                  <UserRound className="h-4 w-4" />
                  Health Profile
                </Link>
              )}
              <AccountMenu userName={userName} settingsTo={settingsTo} />
            </div>
          </header>

          <main
            className={`min-w-0 w-full max-w-full flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-8 ${
              hasFooter ? "pb-[7.25rem] lg:pb-8" : "pb-8"
            } dashboard-bg-container ${contentClassName || ""}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-0 w-full max-w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {hasFooter && footerNav ? (
        <GlassFooterNav items={footerNav} centerAction={centerAction} layoutKey={layoutKey} />
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 360, damping: 24 }}
      className="portal-glass-card rounded-3xl p-5"
    >
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/5 text-black">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-2xl font-extrabold text-[var(--ink)]">{value}</div>
      <div className="text-sm font-semibold text-[var(--ink)]">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{hint}</div> : null}
    </motion.div>
  );
}
