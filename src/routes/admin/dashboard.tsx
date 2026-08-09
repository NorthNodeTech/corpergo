import { createFileRoute } from "@tanstack/react-router";
import { AdminCommandCenter } from "@/features/admin/components/AdminCommandCenter";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return <AdminCommandCenter />;
}
