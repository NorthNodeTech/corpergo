import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import logoImg from "@/assets/LOGO.png";
import { clearSession } from "@/lib/auth";

export type PortalNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function PortalShell({
  title,
  subtitle,
  nav,
  children,
  userName,
}: {
  title: string;
  subtitle: string;
  nav: PortalNavItem[];
  children: ReactNode;
  userName?: string;
}) {
  const [open, setOpen] = useState(false);

  function signOut() {
    clearSession();
    window.location.href = "/login";
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1.5 px-3">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-semibold text-[var(--ink-soft)] transition-colors hover:bg-[var(--sage)]/10 hover:text-[var(--sage-deep)]"
          activeProps={{
            className:
              "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-semibold bg-[var(--sage)] text-white hover:bg-[var(--sage)] hover:text-white",
          }}
          activeOptions={{ exact: to.endsWith("/dashboard") }}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--ivory)] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:border-r lg:border-black/[0.06] lg:bg-white/70 lg:backdrop-blur">
        <div className="px-5 py-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImg} alt="CorpErgo" className="h-11 w-auto object-contain" />
          </Link>
          <div className="mt-4">
            <div className="text-sm font-extrabold text-[var(--ink)]">{title}</div>
            <div className="text-xs text-[var(--ink-soft)] mt-0.5">{subtitle}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          <NavLinks />
        </div>
        <div className="border-t border-black/[0.06] p-4">
          {userName ? (
            <div className="mb-3 truncate px-2 text-sm font-semibold text-[var(--ink)]">
              {userName}
            </div>
          ) : null}
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-[var(--ink-soft)] hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="h-5 w-5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:col-start-2 flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/[0.06] bg-[var(--ivory)]/95 px-4 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white ring-1 ring-black/5"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">{title}</div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
                {subtitle}
              </div>
            </div>
          </div>
          <img src={logoImg} alt="CorpErgo" className="h-9 w-auto object-contain" />
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              className="relative h-full w-[280px] bg-white shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-5">
                <img src={logoImg} alt="CorpErgo" className="h-10 w-auto" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ivory)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-auto border-t p-4">
                <button
                  type="button"
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-rose-700"
                >
                  <LogOut className="h-5 w-5" /> Sign out
                </button>
              </div>
            </motion.aside>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
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
    <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-2xl font-extrabold text-[var(--ink)]">{value}</div>
      <div className="text-sm font-semibold text-[var(--ink)]">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{hint}</div> : null}
    </div>
  );
}
