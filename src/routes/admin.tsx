import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { PortalGuard } from "@/hooks/use-portal-guard";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  head: () => ({
    meta: [{ title: "Admin Portal — CorpErgo" }],
  }),
});

/** Desktop sidebar — admin command sections on one dashboard */
const NAV: PortalNavItem[] = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/dashboard", label: "Network", icon: Building2, hash: "admin-network" },
  { to: "/admin/dashboard", label: "Analytics", icon: Activity, hash: "admin-analytics" },
  { to: "/admin/dashboard", label: "Bookings", icon: ClipboardList, hash: "admin-bookings" },
];

/** Mobile footer — executive sections (not clinical Scan/Queue) */
const FOOTER_NAV: PortalNavItem[] = [
  { to: "/admin/dashboard", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  {
    to: "/admin/dashboard",
    label: "Network",
    shortLabel: "Network",
    icon: Building2,
    hash: "admin-network",
  },
  {
    to: "/admin/dashboard",
    label: "Analytics",
    shortLabel: "Stats",
    icon: Activity,
    hash: "admin-analytics",
  },
  {
    to: "/admin/dashboard",
    label: "Bookings",
    shortLabel: "Bookings",
    icon: ClipboardList,
    hash: "admin-bookings",
  },
];

function AdminLayout() {
  return (
    <PortalGuard pathPrefix="/admin">
      {({ profile }) => (
        <PortalShell
          title="Admin Portal"
          subtitle="Executive command center"
          nav={NAV}
          footerNav={FOOTER_NAV}
          centerAction={{
            to: "/admin/dashboard",
            label: "Alerts",
            icon: Bell,
            onClick: () => {
              window.dispatchEvent(new CustomEvent("corpergo:admin-alerts"));
              requestAnimationFrame(() => {
                document
                  .getElementById("admin-overview")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            },
          }}
          userName={profile.full_name}
        >
          <Outlet />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
