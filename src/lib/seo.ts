import heroImageUrl from "@/assets/corpergo-hero.webp?url";
import logoUrl from "@/assets/corpergo-logo.webp?url";

const GA4_ID = import.meta.env.VITE_GA4_ID?.trim();
const CLARITY_ID = import.meta.env.VITE_MICROSOFT_CLARITY_ID?.trim();
const GOOGLE_SITE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
const BING_SITE_VERIFICATION = import.meta.env.VITE_BING_SITE_VERIFICATION?.trim();

export const SITE_URL = "https://corpergo.in";
export const SITE_NAME = "CorpErgo Physiotherapy & Sports Rehabilitation Center";
export const SITE_TITLE = "CorpErgo Physiotherapy - Greater Whitefield, Bengaluru";
export const SITE_DESCRIPTION =
  "Founded in 2017 by Dr. Pinky Dutta (MPT, PhD). Evidence-based physiotherapy, sports rehabilitation, pain management and corporate ergonomics across five Greater Whitefield clinics in Bengaluru.";
export const SUPPORT_PHONE = "+919148536394";
export const SUPPORT_PHONE_DISPLAY = "+91 91485 36394";
export const SUPPORT_EMAIL = "care@corpergo.in";
export const FACEBOOK_PROFILE = "https://www.facebook.com/corporate.ergonomcs13/";
export const INSTAGRAM_PROFILE = "https://www.instagram.com/corpergophysiorehab.in/";
export const YOUTUBE_PROFILE = "https://www.youtube.com/@corpergo";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const DEFAULT_OG_IMAGE_ALT =
  "CorpErgo Physiotherapy and Sports Rehabilitation clinics in Greater Whitefield, Bengaluru";

export type ClinicLocation = {
  name: string;
  shortName: string;
  address: string;
  locality: string;
  region: string;
  postalCode?: string;
  mapUrl: string;
};

export const CLINIC_LOCATIONS: ClinicLocation[] = [
  {
    name: "CorpErgo Chansandra",
    shortName: "Chansandra",
    address: "50, Narayana Reddy Complex, Chansandra, near Thirumala Bakery, Whitefield",
    locality: "Bengaluru",
    region: "Karnataka",
    postalCode: "560067",
    mapUrl: "https://maps.app.goo.gl/w9o4N65QwY1NGkgc8",
  },
  {
    name: "CorpErgo Balagere",
    shortName: "Balagere",
    address: "Sapthagiri Complex, opposite Hi Life Pearl Shell Apartment, Balagere, Varthur",
    locality: "Bengaluru",
    region: "Karnataka",
    postalCode: "560087",
    mapUrl: "https://maps.app.goo.gl/gP8neSidun1DtXHt7",
  },
  {
    name: "CorpErgo Muthsandra",
    shortName: "Muthsandra",
    address: "Muthsandra, Whitefield",
    locality: "Bengaluru",
    region: "Karnataka",
    mapUrl: "https://maps.app.goo.gl/N8ja8jsPgtCZkdky5",
  },
  {
    name: "CorpErgo Kannamangala",
    shortName: "Kannamangala",
    address: "Kannamangala, Bengaluru East",
    locality: "Bengaluru",
    region: "Karnataka",
    mapUrl: "https://maps.app.goo.gl/AoB5Cftbm3hMzW1HA",
  },
  {
    name: "CorpErgo Manduru",
    shortName: "Manduru",
    address: "Manduru",
    locality: "Bengaluru",
    region: "Karnataka",
    mapUrl: "https://maps.app.goo.gl/HsFRRdwtYAqLZmoC8",
  },
];

export const SERVICES = [
  {
    name: "Orthopedic Rehabilitation",
    description:
      "Comprehensive physiotherapy for back, neck, knee, shoulder, ligament, fracture and joint-replacement recovery.",
  },
  {
    name: "Neurological Rehabilitation",
    description:
      "Specialized rehabilitation for stroke, paralysis, Parkinson's disease, multiple sclerosis and balance disorders.",
  },
  {
    name: "Pain Management",
    description:
      "Root-cause physiotherapy for chronic pain, sciatica, spondylosis, muscle spasms and repetitive strain injuries.",
  },
  {
    name: "Pediatric Rehabilitation",
    description:
      "Dedicated physiotherapy for children with developmental delays, cerebral palsy and movement disorders.",
  },
  {
    name: "Sports Physiotherapy & Performance Rehabilitation",
    description:
      "Injury treatment, sports-specific rehab, return-to-sport conditioning and injury-prevention programs.",
  },
  {
    name: "Corporate Ergonomics & Postural Transformation",
    description:
      "Workstation assessments, posture correction, corporate wellness workshops and work-related injury prevention.",
  },
  {
    name: "Women's Health Physiotherapy",
    description: "Pre-natal, post-natal and pelvic floor physiotherapy.",
  },
  {
    name: "Geriatric Physiotherapy",
    description: "Strength, balance, mobility and fall-prevention programs for older adults.",
  },
  {
    name: "Post-Surgery Rehabilitation",
    description: "Structured recovery after orthopaedic and other planned surgeries.",
  },
] as const;

export const FAQ_SCHEMA_ITEMS = [
  {
    question: "Do I need a doctor's referral to book physiotherapy at CorpErgo?",
    answer:
      "No referral is required for your first assessment. If you have reports, prescriptions or imaging, bring them so the physiotherapist can plan care faster.",
  },
  {
    question: "Where are CorpErgo physiotherapy clinics located in Bengaluru?",
    answer:
      "CorpErgo has clinics in Chansandra, Balagere, Muthsandra, Kannamangala and Manduru, serving Greater Whitefield, Varthur, Bengaluru East and nearby areas.",
  },
  {
    question: "Which physiotherapy services does CorpErgo offer?",
    answer:
      "CorpErgo offers orthopedic rehabilitation, neurological rehab, pain management, pediatric rehabilitation, sports physiotherapy, corporate ergonomics, women's health physiotherapy, geriatric physiotherapy and post-surgery rehab.",
  },
  {
    question: "Can I book online or by phone?",
    answer:
      "Yes. You can book directly on the website without logging in, sign in to the patient portal to manage appointments, or call CorpErgo for help scheduling.",
  },
  {
    question: "How long is a typical physiotherapy session?",
    answer:
      "Most sessions run 45 to 60 minutes depending on your condition and treatment plan. Follow-up sessions may be shorter once your program is established.",
  },
  {
    question: "Do you treat back pain, neck pain, knee pain and posture problems?",
    answer:
      "Yes. CorpErgo physiotherapists assess posture, strength, mobility and pain triggers, then create a treatment and exercise plan for back, neck, knee, shoulder and other musculoskeletal problems.",
  },
] as const;

type MetaDescriptor = Record<string, unknown>;
type LinkDescriptor = Record<string, string>;
type ScriptDescriptor = {
  src?: string;
  async?: boolean;
  defer?: boolean;
  children?: string;
  [key: string]: unknown;
};

export type RouteHead = {
  meta: MetaDescriptor[];
  links: LinkDescriptor[];
  scripts?: ScriptDescriptor[];
};

type RouteHeadOptions = {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  structuredData?: MetaDescriptor[];
};

export function absoluteUrl(path = "/") {
  const url = new URL(path, SITE_URL);
  return url.toString();
}

export function publicRouteHead(options: RouteHeadOptions): RouteHead {
  return routeHead({ ...options, noindex: false });
}

export function privateRouteHead(path: string, title: string, description: string): RouteHead {
  return routeHead({ path, title, description, noindex: true });
}

export function routeHead({
  path,
  title,
  description,
  noindex = false,
  type = "website",
  image = DEFAULT_OG_IMAGE,
  imageAlt = DEFAULT_OG_IMAGE_ALT,
  structuredData = [],
}: RouteHeadOptions): RouteHead {
  const canonical = absoluteUrl(path);
  const robots = noindex
    ? "noindex, nofollow, noarchive"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: robots },
      { name: "googlebot", content: robots },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:alt", content: imageAlt },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: imageAlt },
      ...structuredData,
    ],
    links: [
      { rel: "canonical", href: canonical },
      { rel: "alternate", href: canonical, hrefLang: "en-IN" },
    ],
  };
}

export function rootMeta(): MetaDescriptor[] {
  return [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    { title: SITE_TITLE },
    { name: "description", content: SITE_DESCRIPTION },
    { name: "robots", content: "index, follow, max-image-preview:large" },
    { name: "author", content: SITE_NAME },
    { name: "application-name", content: SITE_NAME },
    { name: "theme-color", content: "#ff9933" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-title", content: SITE_NAME },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    { name: "format-detection", content: "telephone=yes" },
    ...(GOOGLE_SITE_VERIFICATION
      ? [{ name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION }]
      : []),
    ...(BING_SITE_VERIFICATION ? [{ name: "msvalidate.01", content: BING_SITE_VERIFICATION }] : []),
  ];
}

export function rootLinks(appCss: string): LinkDescriptor[] {
  return [
    { rel: "stylesheet", href: appCss },
    { rel: "icon", href: "/favicon.ico", sizes: "any" },
    { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
    { rel: "manifest", href: "/site.webmanifest" },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "preconnect", href: "https://cdn.jsdelivr.net", crossOrigin: "anonymous" },
    { rel: "preconnect", href: "https://gnmahvpujdthvthsypaj.supabase.co" },
    ...(GA4_ID ? [{ rel: "preconnect", href: "https://www.googletagmanager.com" }] : []),
    ...(CLARITY_ID ? [{ rel: "preconnect", href: "https://www.clarity.ms" }] : []),
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap",
    },
  ];
}

export function analyticsHeadScripts(): ScriptDescriptor[] {
  const scripts: ScriptDescriptor[] = [];

  if (GA4_ID) {
    scripts.push({
      async: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`,
    });
    scripts.push({
      children: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA4_ID)}, { anonymize_ip: true });
`.trim(),
    });
  }

  if (CLARITY_ID) {
    scripts.push({
      children: `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", ${JSON.stringify(CLARITY_ID)});
`.trim(),
    });
  }

  return scripts;
}

export function webPageLd(path: string, name: string, description: string): MetaDescriptor {
  const url = absoluteUrl(path);
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name,
      description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      primaryImageOfPage: { "@id": `${SITE_URL}/#primaryimage` },
    },
  };
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>): MetaDescriptor {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      })),
    },
  };
}

export function homepageStructuredData(): MetaDescriptor[] {
  const serviceNodes = SERVICES.map((service) => ({
    "@type": "Service",
    "@id": `${SITE_URL}/#service-${slugify(service.name)}`,
    name: service.name,
    description: service.description,
    serviceType: service.name,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: bengaluruArea(),
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl("/direct-booking"),
      servicePhone: SUPPORT_PHONE,
    },
  }));

  return [
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "CorpErgo Physiotherapy & Sports Rehabilitation Center",
            alternateName: [
              "CorpErgo",
              "CorpErgo Physiotherapy",
              "CorpErgo Physiotherapy and Rehabilitation",
            ],
            url: SITE_URL,
            logo: {
              "@type": "ImageObject",
              "@id": `${SITE_URL}/#logo`,
              url: absoluteAssetUrl(logoUrl),
            },
            image: { "@id": `${SITE_URL}/#primaryimage` },
            description: SITE_DESCRIPTION,
            telephone: SUPPORT_PHONE,
            email: SUPPORT_EMAIL,
            sameAs: [
              INSTAGRAM_PROFILE,
              FACEBOOK_PROFILE,
              YOUTUBE_PROFILE,
              "https://www.practo.com/bangalore/clinic/corpergo-physiotherapy-occupational-health-centre-channasandra-1",
              "https://kivihealth.com/clinic/corpergo-physiotherapy-%26-occupational-health-centre",
            ],
            founder: { "@id": `${SITE_URL}/#dr-pinky-dutta` },
            foundingDate: "2017",
            contactPoint: [
              {
                "@type": "ContactPoint",
                telephone: SUPPORT_PHONE,
                contactType: "appointments",
                areaServed: "IN",
                availableLanguage: ["English", "Hindi", "Kannada"],
              },
            ],
            department: CLINIC_LOCATIONS.map((clinic) => ({
              "@id": `${SITE_URL}/#clinic-${slugify(clinic.shortName)}`,
            })),
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: SITE_URL,
            name: SITE_NAME,
            description: SITE_DESCRIPTION,
            publisher: { "@id": `${SITE_URL}/#organization` },
            inLanguage: "en-IN",
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}/#webpage`,
            url: SITE_URL,
            name: SITE_TITLE,
            description: SITE_DESCRIPTION,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            about: { "@id": `${SITE_URL}/#organization` },
            primaryImageOfPage: { "@id": `${SITE_URL}/#primaryimage` },
            inLanguage: "en-IN",
          },
          {
            "@type": "ImageObject",
            "@id": `${SITE_URL}/#primaryimage`,
            url: DEFAULT_OG_IMAGE,
            contentUrl: DEFAULT_OG_IMAGE,
            width: 1200,
            height: 630,
            caption: DEFAULT_OG_IMAGE_ALT,
          },
          {
            "@type": ["LocalBusiness", "MedicalBusiness"],
            "@id": `${SITE_URL}/#localbusiness`,
            name: "CorpErgo Physiotherapy & Sports Rehabilitation Center",
            url: SITE_URL,
            image: DEFAULT_OG_IMAGE,
            telephone: SUPPORT_PHONE,
            email: SUPPORT_EMAIL,
            priceRange: "INR",
            address: {
              "@type": "PostalAddress",
              streetAddress: CLINIC_LOCATIONS[0].address,
              addressLocality: CLINIC_LOCATIONS[0].locality,
              addressRegion: CLINIC_LOCATIONS[0].region,
              postalCode: CLINIC_LOCATIONS[0].postalCode,
              addressCountry: "IN",
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                opens: "08:00",
                closes: "20:00",
              },
            ],
            parentOrganization: { "@id": `${SITE_URL}/#organization` },
            medicalSpecialty: ["Physiotherapy", "SportsMedicine", "Orthopedic"],
            areaServed: bengaluruArea(),
            hasMap: CLINIC_LOCATIONS[0].mapUrl,
          },
          ...CLINIC_LOCATIONS.map((clinic) => ({
            "@type": ["LocalBusiness", "MedicalBusiness"],
            "@id": `${SITE_URL}/#clinic-${slugify(clinic.shortName)}`,
            name: clinic.name,
            url: `${SITE_URL}/#clinics`,
            telephone: SUPPORT_PHONE,
            parentOrganization: { "@id": `${SITE_URL}/#organization` },
            address: {
              "@type": "PostalAddress",
              streetAddress: clinic.address,
              addressLocality: clinic.locality,
              addressRegion: clinic.region,
              ...(clinic.postalCode ? { postalCode: clinic.postalCode } : {}),
              addressCountry: "IN",
            },
            hasMap: clinic.mapUrl,
            areaServed: bengaluruArea(),
          })),
          {
            "@type": "Person",
            "@id": `${SITE_URL}/#dr-pinky-dutta`,
            name: "Dr. Pinky Dutta",
            honorificSuffix: "MPT, PhD",
            jobTitle: "Founder and Clinical Director",
            worksFor: { "@id": `${SITE_URL}/#organization` },
            knowsAbout: [
              "Physiotherapy",
              "Sports rehabilitation",
              "Pain management",
              "Corporate ergonomics",
              "Neurological rehabilitation",
              "Post-surgery rehabilitation",
            ],
          },
          ...serviceNodes,
          {
            "@type": "FAQPage",
            "@id": `${SITE_URL}/#faq`,
            mainEntity: FAQ_SCHEMA_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${SITE_URL}/#breadcrumbs`,
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_URL,
              },
            ],
          },
        ],
      },
    },
  ];
}

export function directBookingStructuredData(): MetaDescriptor[] {
  return [
    webPageLd(
      "/direct-booking",
      "Direct Physiotherapy Booking - CorpErgo",
      "Request a CorpErgo physiotherapy appointment online and get a confirmation call from clinic staff.",
    ),
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Direct Booking", path: "/direct-booking" },
    ]),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${SITE_URL}/direct-booking#service`,
        name: "Physiotherapy Appointment Booking",
        description: "Online appointment request for CorpErgo physiotherapy clinics in Bengaluru.",
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: bengaluruArea(),
        serviceType: "Physiotherapy appointment",
        potentialAction: {
          "@type": "ReserveAction",
          target: absoluteUrl("/direct-booking"),
          result: {
            "@type": "Reservation",
            name: "Physiotherapy appointment request",
          },
        },
      },
    },
  ];
}

function bengaluruArea() {
  return {
    "@type": "City",
    name: "Bengaluru",
    containedInPlace: {
      "@type": "State",
      name: "Karnataka",
    },
  };
}

function absoluteAssetUrl(assetUrl: string) {
  if (assetUrl.startsWith("http://") || assetUrl.startsWith("https://")) return assetUrl;
  return absoluteUrl(assetUrl);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export { heroImageUrl };
