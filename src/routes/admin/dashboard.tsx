import { createFileRoute } from "@tanstack/react-router";
import { AdminCommandCenter } from "@/features/admin/components/AdminCommandCenter";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
  head: () =>
    privateRouteHead(
      "/admin/dashboard",
      "Admin Dashboard - CorpErgo",
      "Private CorpErgo administration dashboard for clinic operations and reporting.",
    ),
});

function AdminDashboardPage() {
  return <AdminCommandCenter />;
}
