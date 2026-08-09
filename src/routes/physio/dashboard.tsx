import { createFileRoute } from "@tanstack/react-router";
import { ClinicalWorkspace } from "@/features/physio/components/ClinicalWorkspace";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/physio/dashboard")({
  component: PhysioDashboardPage,
  head: () =>
    privateRouteHead(
      "/physio/dashboard",
      "Clinical Dashboard - CorpErgo Physio Portal",
      "Private CorpErgo clinical workspace for appointments, payments and treatment flow.",
    ),
});

function PhysioDashboardPage() {
  return <ClinicalWorkspace />;
}
