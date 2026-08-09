import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { privateRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () =>
    privateRouteHead(
      "/login",
      "Login - CorpErgo Physiotherapy",
      "Secure sign-in for CorpErgo patients, physiotherapists and clinic administrators.",
    ),
});

function LoginPage() {
  useEffect(() => {
    window.location.replace("/?login=true");
  }, []);

  return null;
}
