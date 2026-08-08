import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  Home,
  LayoutDashboard,
  PhoneCall,
  ScanLine,
} from "lucide-react";
import { useState } from "react";
import { InstantBookingModal } from "@/components/physio/InstantBookingModal";
import { InstantBookingProvider } from "@/components/physio/instant-booking-context";
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
  const [instantOpen, setInstantOpen] = useState(false);

  return (
    <PortalGuard pathPrefix="/physio">
      {({ profile }) => (
        <InstantBookingProvider open={() => setInstantOpen(true)}>
          <PortalShell
            title="Clinical Workspace"
            subtitle="Patient-first care floor"
            nav={NAV}
            footerNav={FOOTER_NAV}
            desktopNav="header"
            headerNavMode="full"
            centerAction={{
              to: "/physio/scan",
              label: "Scan",
              icon: ScanLine,
            }}
            userName={profile.full_name}
            headerActions={
              <button
                type="button"
                onClick={() => setInstantOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--saffron)] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--saffron-deep)] sm:px-4 sm:text-sm"
              >
                <PhoneCall className="h-4 w-4" />
                <span className="hidden sm:inline">Instant booking</span>
                <span className="sm:hidden">Instant</span>
              </button>
            }
          >
            <Outlet />
          </PortalShell>
          <InstantBookingModal open={instantOpen} onClose={() => setInstantOpen(false)} />
        </InstantBookingProvider>
      )}
    </PortalGuard>
  );
}
