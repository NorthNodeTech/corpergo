import { createFileRoute } from "@tanstack/react-router";
import { AppointmentRequestsPage } from "@/features/physio/pages/AppointmentRequestsPage";

export const Route = createFileRoute("/physio/requests")({
  component: AppointmentRequestsPage,
});
