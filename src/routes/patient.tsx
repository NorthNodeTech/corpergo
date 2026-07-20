import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import {
  CalendarPlus,
  ClipboardList,
  FileText,
  LayoutDashboard,
  QrCode,
  Settings,
  UserRound,
} from "lucide-react";
import { PortalShell, type PortalNavItem } from "@/components/portal/PortalShell";
import { PortalGuard } from "@/hooks/use-portal-guard";

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
        content: "Book appointments, view reports, and manage your CorpErgo care.",
      },
    ],
  }),
});

const NAV: PortalNavItem[] = [
  { to: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patient/book", label: "Book Appointment", icon: CalendarPlus },
  { to: "/patient/appointments", label: "My Appointments", icon: ClipboardList },
  { to: "/patient/reports", label: "Medical Reports", icon: FileText },
  { to: "/patient/qr-ticket", label: "QR Ticket", icon: QrCode },
  { to: "/patient/profile", label: "Health Profile", icon: UserRound },
  { to: "/patient/settings", label: "Settings", icon: Settings },
];

function PatientLayout() {
  return (
    <PortalGuard pathPrefix="/patient">
      {({ profile }) => (
        <PortalShell
          title="Patient Portal"
          subtitle="Your care, simplified"
          nav={NAV}
          userName={profile.full_name}
        >
          <Outlet />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
