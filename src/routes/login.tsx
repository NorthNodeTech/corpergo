import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — CorpErgo Physiotherapy" },
      {
        name: "description",
        content:
          "Secure sign-in for patients and clinic staff at CorpErgo. Administrators use staff login.",
      },
    ],
  }),
});

function LoginPage() {
  useEffect(() => {
    window.location.replace("/?login=true");
  }, []);

  return null;
}
