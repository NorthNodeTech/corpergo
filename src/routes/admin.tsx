import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
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

const NAV: PortalNavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function AdminLayout() {
  return (
    <PortalGuard pathPrefix="/admin">
      {({ profile }) => (
        <PortalShell
          title="Admin Portal"
          subtitle="Executive operations"
          nav={NAV}
          userName={profile.full_name}
        >
          <Outlet />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
