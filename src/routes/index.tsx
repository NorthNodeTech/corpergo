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
      title: "CorpErgo Physiotherapy & Sports Rehabilitation - Greater Whitefield",
      description:
        "Founded in 2017 by Dr. Pinky Dutta (MPT, PhD). Book evidence-based physiotherapy in Greater Whitefield, Bengaluru for pain relief, sports rehab, neurological recovery, pediatric care and corporate ergonomics across 5 CorpErgo clinics.",
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
