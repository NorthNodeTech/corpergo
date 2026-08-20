import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/industrial-ergonomics/")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "industrial-ergonomics" });
  },
});
