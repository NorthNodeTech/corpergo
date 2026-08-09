import {
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  Home,
  LayoutDashboard,
  ScanLine,
} from "lucide-react";
import type { PortalNavItem } from "@/shared/components/layout/PortalShell";

export const physioHeaderNav: PortalNavItem[] = [
  { to: "/physio/dashboard", label: "Workspace", icon: LayoutDashboard },
  { to: "/physio/scan", label: "Scan QR", icon: ScanLine },
  { to: "/physio/queue", label: "Today's Queue", icon: ClipboardCheck },
  { to: "/physio/requests", label: "Requests", icon: ClipboardList },
  { to: "/physio/assessments", label: "Assessments", icon: FileBarChart },
];

/** Side tabs only — Scan sits in the elevated center action */
export const physioFooterNav: PortalNavItem[] = [
  { to: "/physio/dashboard", label: "Workspace", shortLabel: "Home", icon: Home },
  { to: "/physio/queue", label: "Queue", shortLabel: "Queue", icon: ClipboardCheck },
  { to: "/physio/requests", label: "Requests", shortLabel: "Requests", icon: ClipboardList },
  { to: "/physio/assessments", label: "Assess", shortLabel: "Assess", icon: FileBarChart },
];
