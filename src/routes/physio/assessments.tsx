import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/physio/assessments")({
  component: () => <Outlet />,
});
