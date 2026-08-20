import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/industrial-ergonomics")({
  component: () => <Outlet />,
});
