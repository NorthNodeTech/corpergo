import { createFileRoute, redirect } from "@tanstack/react-router";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/patient/reports/$reportId")({
  head: () =>
    privateRouteHead(
      "/patient/reports/$reportId",
      "Patient Report - CorpErgo Patient Portal",
      "Private CorpErgo patient report redirects to the patient dashboard.",
    ),
  beforeLoad: () => {
    throw redirect({ to: "/patient/dashboard" });
  },
});
