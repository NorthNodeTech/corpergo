import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "CorpErgo Physiotherapy — Bengaluru's Premium Recovery Clinic" },
      {
        name: "description",
        content:
          "Evidence-based physiotherapy for pain relief, mobility, sports & post-surgery rehab. 5 CorpErgo clinics in Bengaluru with certified physiotherapists.",
      },
    ],
  }),
});
