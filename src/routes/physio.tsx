import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  ScanLine,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { PortalGuard } from "@/hooks/use-portal-guard";

export const Route = createFileRoute("/physio")({
  component: PhysioLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/physio" || location.pathname === "/physio/") {
      throw redirect({ to: "/physio/dashboard" });
    }
  },
  head: () => ({
    meta: [{ title: "Physiotherapist Portal — CorpErgo" }],
  }),
});

const NAV: PortalNavItem[] = [
  { to: "/physio/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/physio/scan", label: "Scan QR", icon: ScanLine },
  { to: "/physio/requests", label: "Appointment Requests", icon: ClipboardList },
  { to: "/physio/queue", label: "Today's Queue", icon: ClipboardCheck },
  { to: "/physio/assessments", label: "Assessments", icon: FileBarChart },
];

function PhysioLayout() {
  return (
    <PortalGuard pathPrefix="/physio">
      {({ profile }) => (
        <PortalShell
          title="Physio Portal"
          subtitle="Clinic care workspace"
          nav={NAV}
          userName={profile.full_name}
        >
          <Outlet />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
