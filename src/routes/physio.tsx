import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  Home,
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
  { to: "/physio/dashboard", label: "Workspace", icon: LayoutDashboard },
  { to: "/physio/scan", label: "Scan QR", icon: ScanLine },
  { to: "/physio/queue", label: "Today's Queue", icon: ClipboardCheck },
  { to: "/physio/requests", label: "Requests", icon: ClipboardList },
  { to: "/physio/assessments", label: "Assessments", icon: FileBarChart },
];

/** Side tabs only — Scan sits in the elevated center action */
const FOOTER_NAV: PortalNavItem[] = [
  { to: "/physio/dashboard", label: "Workspace", shortLabel: "Home", icon: Home },
  { to: "/physio/queue", label: "Queue", shortLabel: "Queue", icon: ClipboardCheck },
  { to: "/physio/requests", label: "Requests", shortLabel: "Requests", icon: ClipboardList },
  { to: "/physio/assessments", label: "Assess", shortLabel: "Assess", icon: FileBarChart },
];

function PhysioLayout() {
  return (
    <PortalGuard pathPrefix="/physio">
      {({ profile }) => (
        <PortalShell
          title="Clinical Workspace"
          subtitle="Patient-first care floor"
          nav={NAV}
          footerNav={FOOTER_NAV}
          centerAction={{
            to: "/physio/scan",
            label: "Scan",
            icon: ScanLine,
          }}
          userName={profile.full_name}
        >
          <Outlet />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
