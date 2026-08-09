import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/patient/settings")({
  beforeLoad: () => {
    throw redirect({ to: "/patient/dashboard" });
  },
});
