import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/patient/reports/$reportId")({
  beforeLoad: () => {
    throw redirect({ to: "/patient/dashboard" });
  },
});
