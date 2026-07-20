import { createFileRoute } from "@tanstack/react-router";
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return <AdminCommandCenter />;
}
