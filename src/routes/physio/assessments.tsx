import { Outlet, createFileRoute } from "@tanstack/react-router";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/physio/assessments")({
  component: () => <Outlet />,
  head: () =>
    privateRouteHead(
      "/physio/assessments",
      "Assessments - CorpErgo Physio Portal",
      "Private CorpErgo assessment workspace for clinical notes and treatment records.",
    ),
});
