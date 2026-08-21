import { createFileRoute } from "@tanstack/react-router";
import { ErgonomicsPage } from "@/features/landing/ErgonomicsPage";
import { publicRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/ergonomics")({
  component: ErgonomicsPage,
  head: () =>
    publicRouteHead({
      path: "/ergonomics",
      title: "Industrial & Corporate Ergonomics - CorpErgo",
      description:
        "CorpErgo ergonomics for industrial and corporate teams — safe machine use, posture training, workstation assessment, and injury prevention in Greater Whitefield, Bengaluru.",
    }),
});
