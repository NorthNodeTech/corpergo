import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { PortalShell } from "@/shared/components/layout/PortalShell";
import { PortalGuard } from "@/shared/hooks/use-portal-guard";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  head: () =>
    privateRouteHead(
      "/admin",
      "Admin Portal - CorpErgo",
      "Private CorpErgo administration workspace for clinic operations and reporting.",
    ),
});

function AdminLayout() {
  return (
    <PortalGuard pathPrefix="/admin">
      {({ profile }) => (
        <PortalShell
          title="Admin Portal"
          subtitle="Executive command center"
          nav={[]}
          desktopNav="header"
          userName={profile.full_name}
        >
          <Outlet />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
