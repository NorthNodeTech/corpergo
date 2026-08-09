import { createFileRoute } from "@tanstack/react-router";
import { ClinicalWorkspace } from "@/features/physio/components/ClinicalWorkspace";

export const Route = createFileRoute("/physio/dashboard")({
  component: PhysioDashboardPage,
});

function PhysioDashboardPage() {
  return <ClinicalWorkspace />;
}
