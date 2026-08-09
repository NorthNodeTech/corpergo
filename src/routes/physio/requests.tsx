import { createFileRoute } from "@tanstack/react-router";
import { AppointmentRequestsPage } from "@/features/physio/pages/AppointmentRequestsPage";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/physio/requests")({
  component: AppointmentRequestsPage,
  head: () =>
    privateRouteHead(
      "/physio/requests",
      "Appointment Requests - CorpErgo Physio Portal",
      "Review, accept and schedule private CorpErgo appointment requests.",
    ),
});
