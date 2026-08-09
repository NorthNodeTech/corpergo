import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  heroImageUrl,
  homepageStructuredData,
  publicRouteHead,
} from "@/lib/seo";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => {
    const head = publicRouteHead({
      path: "/",
      title: "CorpErgo Physiotherapy - Bengaluru's Premium Recovery Clinic",
      description:
        "Book evidence-based physiotherapy in Bengaluru for pain relief, sports injuries, posture correction, neurological rehab and post-surgery recovery across 5 CorpErgo clinics.",
      image: DEFAULT_OG_IMAGE,
      imageAlt: DEFAULT_OG_IMAGE_ALT,
      structuredData: homepageStructuredData(),
    });

    return {
      ...head,
      links: [
        ...head.links,
        { rel: "preload", as: "image", href: heroImageUrl, fetchPriority: "high" },
      ],
    };
  },
});
