import { createFileRoute, redirect } from "@tanstack/react-router";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/patient/settings")({
  head: () =>
    privateRouteHead(
      "/patient/settings",
      "Settings - CorpErgo Patient Portal",
      "Private CorpErgo patient settings redirect to the patient dashboard.",
    ),
  beforeLoad: () => {
    throw redirect({ to: "/patient/dashboard" });
  },
});
