import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { PhoneCall, ScanLine } from "lucide-react";
import { useState } from "react";
import { physioFooterNav, physioHeaderNav } from "@/features/physio/config/navigation";
import { InstantBookingModal } from "@/features/physio/components/InstantBookingModal";
import { InstantBookingProvider } from "@/features/physio/components/instant-booking-context";
import { PortalShell } from "@/shared/components/layout/PortalShell";
import { PortalGuard } from "@/shared/hooks/use-portal-guard";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/physio")({
  component: PhysioLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/physio" || location.pathname === "/physio/") {
      throw redirect({ to: "/physio/dashboard" });
    }
  },
  head: () =>
    privateRouteHead(
      "/physio",
      "Physiotherapist Portal - CorpErgo",
      "Private CorpErgo clinical workspace for physiotherapists and clinic staff.",
    ),
});

function PhysioLayout() {
  const [instantOpen, setInstantOpen] = useState(false);

  return (
    <PortalGuard pathPrefix="/physio">
      {({ profile }) => (
        <InstantBookingProvider open={() => setInstantOpen(true)}>
          <PortalShell
            title="Clinical Workspace"
            subtitle="Patient-first care floor"
            nav={physioHeaderNav}
            footerNav={physioFooterNav}
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
