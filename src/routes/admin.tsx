import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PortalShell } from "@/shared/components/layout/PortalShell";
import { PortalGuard } from "@/shared/hooks/use-portal-guard";

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

function AdminLayout() {
  return (
    <PortalGuard pathPrefix="/admin">
      {({ profile }) => (
        <PortalShell
          title="Admin Portal"
          subtitle="Executive command center"
          nav={[]}
          footerNav={[]}
          desktopNav="header"
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
