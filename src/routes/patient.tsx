import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { patientFooterNav, patientHeaderNav } from "@/features/patient/config/navigation";
import { PortalShell } from "@/shared/components/layout/PortalShell";
import { PortalGuard } from "@/shared/hooks/use-portal-guard";

export const Route = createFileRoute("/patient")({
  component: PatientLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/patient" || location.pathname === "/patient/") {
      throw redirect({ to: "/patient/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Patient Portal — CorpErgo" },
      {
        name: "description",
        content: "Book appointments, track visits, and manage your CorpErgo care.",
      },
    ],
  }),
});

function PatientLayout() {
  return (
    <PortalGuard pathPrefix="/patient">
      {({ profile }) => (
        <PortalShell
          title="Patient Portal"
          subtitle="Your care, simplified"
          nav={patientHeaderNav}
          footerNav={patientFooterNav}
          desktopNav="header"
          headerNavMode="full"
          staticNav
          userName={profile.full_name}
        >
          <Outlet />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
