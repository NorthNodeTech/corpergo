import {
  CalendarPlus,
  ClipboardList,
  Home,
  LayoutDashboard,
  QrCode,
  UserRound,
} from "lucide-react";
import type { PortalNavItem } from "@/shared/components/layout/PortalShell";

export const patientHeaderNav: PortalNavItem[] = [
  { to: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patient/book", label: "Book Appointment", icon: CalendarPlus },
  { to: "/patient/appointments", label: "My Appointments", icon: ClipboardList },
  { to: "/patient/qr-ticket", label: "QR Ticket", icon: QrCode },
];

export const patientFooterNav: PortalNavItem[] = [
  { to: "/patient/dashboard", label: "Home", shortLabel: "Home", icon: Home },
  { to: "/patient/book", label: "Book", shortLabel: "Book", icon: CalendarPlus },
  { to: "/patient/appointments", label: "Visits", shortLabel: "Visits", icon: ClipboardList },
  { to: "/patient/qr-ticket", label: "QR Ticket", shortLabel: "QR", icon: QrCode },
  { to: "/patient/profile", label: "Profile", shortLabel: "Profile", icon: UserRound },
];
