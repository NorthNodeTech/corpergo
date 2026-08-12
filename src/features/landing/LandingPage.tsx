import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useMotionValue, animate, useInView } from "framer-motion";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity,
  Brain,
  Bone,
  Dumbbell,
  HeartPulse,
  Baby,
  UserRound,
  Stethoscope,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Star,
  Sparkles,
  Play,
  Menu,
  X,
  Quote,
  CalendarPlus,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import {
  FacebookIcon,
  GmailIcon,
  GoogleMapsIcon,
  InstagramIcon,
  PhoneAppIcon,
  YouTubeIcon,
} from "@/shared/components/icons/BrandIcons";
import heroImg from "@/assets/corpergo-hero.webp";
import aboutImg from "@/assets/abt.webp";
import pinkyImg from "@/assets/Pinkyce.webp";
import reelClinicMoments from "@/assets/reels/reel-clinic-moments.webp";
import reelHandsOnCare from "@/assets/reels/reel-hands-on-care.webp";
import reelRecoveryMotion from "@/assets/reels/reel-recovery-motion.webp";
import reelPatientJourney from "@/assets/reels/reel-patient-journey.webp";
import reelTherapyInsights from "@/assets/reels/reel-therapy-insights.webp";
import reelStrongerEveryday from "@/assets/reels/reel-stronger-everyday.webp";
import treatmentOrthopaedic from "@/assets/treatments/treatment-orthopaedic.webp";
import treatmentNeurological from "@/assets/treatments/treatment-neurological.webp";
import treatmentSports from "@/assets/treatments/treatment-sports.webp";
import treatmentMusculoskeletal from "@/assets/treatments/treatment-musculoskeletal.webp";
import treatmentWomensHealth from "@/assets/treatments/treatment-womens-health.webp";
import treatmentPediatric from "@/assets/treatments/treatment-pediatric.webp";
import treatmentGeriatric from "@/assets/treatments/treatment-geriatric.webp";
import treatmentPostSurgery from "@/assets/treatments/treatment-post-surgery.webp";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { cn } from "@/lib/core/utils";
import {
  FACEBOOK_PROFILE,
  INSTAGRAM_PROFILE,
  YOUTUBE_PROFILE,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
} from "@/lib/seo";

const LoginModal = lazy(() =>
  import("@/features/auth/components/LoginModal").then((module) => ({
    default: module.LoginModal,
  })),
);

const LANDING_NAV_LINK =
  "landing-nav__link inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-2.5 py-1.5 text-xs font-semibold leading-snug text-white shadow-sm transition-colors hover:bg-[var(--saffron)] hover:!text-white";

/* ------------------------------ helpers ------------------------------ */

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.floor(v).toLocaleString() + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, mv, to, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
} as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
} as const;

const fadeItem = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeOut } },
} as const;

function AmbientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="alive-orb alive-orb--a" />
      <div className="alive-orb alive-orb--b" />
      <div className="alive-orb alive-orb--c" />
    </div>
  );
}

function MotionMarquee() {
  const items = [
    "Evidence-Based Care",
    "5 Bengaluru Clinics",
    "Certified Physiotherapists",
    "Post-Surgery Rehab",
    "Sports Recovery",
    "One-on-One Sessions",
    "Neurological Rehab",
    "Women's Health",
  ];
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-black/10 bg-black/5 py-4 backdrop-blur-sm">
      <div className="alive-marquee flex w-max gap-10 whitespace-nowrap">
        {loop.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex items-center gap-3 text-sm font-bold tracking-wide text-black"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--sage)]" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ NAV ------------------------------ */

function Nav({ onLoginClick, onBookClick }: { onLoginClick: () => void; onBookClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".hero-fit");
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
      if (!hero) {
        setOverHero(false);
        return;
      }
      setOverHero(hero.getBoundingClientRect().bottom > 72);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const items = [
    ["About", "#about"],
    ["Treatments", "#treatments"],
    ["Testimonials", "#testimonials"],
    ["Videos", "#videos"],
    ["Clinics", "#clinics"],
    ["FAQ", "#faq"],
    ["Contact", "#contact"],
  ];

  const onHero = overHero && !scrolled;

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="landing-nav fixed inset-x-0 top-0 z-50 py-2 sm:py-2.5"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div
          className={cn(
            "landing-nav__shell flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-2xl px-2.5 py-2 transition-all duration-300 sm:min-h-[3.35rem] sm:gap-3 sm:px-3",
            "lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-3 xl:gap-x-4",
            scrolled &&
              "border border-black/[0.08] bg-white/92 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md",
            !scrolled &&
              onHero &&
              "border border-white/22 bg-black/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md",
            !scrolled &&
              !onHero &&
              "border border-black/[0.07] bg-white/88 shadow-sm backdrop-blur-sm",
          )}
        >
          <Link
            to="/"
            className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron)]/40 focus-visible:ring-offset-2 rounded-xl"
            aria-label="CorpErgo Physiotherapy and Rehabilitation â€” Home"
          >
            <CorpErgoLogo
              size="xs"
              withFrame={false}
              background={onHero ? "dark" : "light"}
              className="h-10 w-10 shrink-0 transition-all duration-300 group-hover:scale-[1.03] sm:h-11 sm:w-11"
            />
            <div className="min-w-0">
              <div
                className={cn(
                  "corpergo-brand-title landing-nav__brand-title truncate text-sm sm:text-[15px]",
                  onHero ? "text-white" : "text-[var(--ink)]",
                )}
              >
                <span className="text-[var(--saffron)]">Corp</span>
                <span className={onHero ? "text-white" : "text-[var(--ink)]"}>Ergo</span>
              </div>
              <div className="corpergo-brand-tagline landing-nav__brand-tagline">
                Physiotherapy &amp; Rehabilitation
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center justify-center gap-1.5 min-w-0 xl:gap-2">
            {items.map(([label, href]) => (
              <a key={label} href={href} className={LANDING_NAV_LINK}>
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onLoginClick}
              className={cn(LANDING_NAV_LINK, "cursor-pointer focus:outline-none")}
            >
              Login
            </button>
            <button
              type="button"
              onClick={onBookClick}
              className="group hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--saffron)] px-2.5 py-1.5 text-xs font-semibold leading-snug text-white shadow-sm transition-colors hover:bg-[var(--saffron-deep)] hover:text-white cursor-pointer focus:outline-none"
            >
              <span>
                Book<span className="hidden md:inline"> Appointment</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "lg:hidden grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors",
                scrolled || !onHero
                  ? "bg-white/80 ring-1 ring-black/8 text-[var(--ink)]"
                  : "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm",
              )}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden mt-2 rounded-2xl border border-black/[0.08] bg-white/95 p-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-md"
          >
            {items.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3.5 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--saffron)] hover:text-white"
              >
                {label}
              </a>
            ))}
            <div className="my-1 border-t border-black/[0.05]" />
            <button
              onClick={() => {
                setOpen(false);
                onLoginClick();
              }}
              className="w-full block rounded-xl px-3.5 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--saffron)] hover:text-white text-left cursor-pointer focus:outline-none"
            >
              Login
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onBookClick();
              }}
              className="w-full block rounded-xl px-3.5 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--saffron)] hover:text-white text-left cursor-pointer focus:outline-none"
            >
              Book Appointment
            </button>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

/* ------------------------------ HERO ------------------------------ */

function Hero({ onBookClick }: { onBookClick: () => void }) {
  const heroStats = [
    ["5", "Clinics"],
    ["1000+", "Patients"],
    ["15+", "Physios"],
  ] as const;

  return (
    <section className="hero-fit relative bg-neutral-900">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] sm:object-[68%_center] lg:object-right brightness-[0.92] contrast-[1.03]"
          width={1600}
          height={1000}
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-neutral-900/18" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/45 via-neutral-900/22 to-neutral-900/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/35 via-transparent to-neutral-900/12" />
      </div>

      <div className="hero-fit__inner relative z-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-[34rem] lg:max-w-[38rem]"
          >
            <motion.h1
              variants={fadeItem}
              className="hero-fit__title text-white text-balance drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]"
            >
              Relieve pain.
              <br />
              <span className="text-[var(--saffron)]">Restore</span>{" "}
              <span className="relative inline-block">
                movement.
                <svg
                  className="absolute -bottom-1 left-0 w-full overflow-visible"
                  height="8"
                  viewBox="0 0 300 10"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d="M2 7 Q 75 2, 150 6 T 298 5"
                    stroke="var(--saffron)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.85, duration: 1.1, ease: easeOut }}
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p variants={fadeItem} className="hero-fit__body text-white/88 drop-shadow-sm">
              Professional physiotherapy for pain relief, mobility restoration, neurological
              rehabilitation, sports injuries and long-term wellness â€” delivered by certified
              physiotherapists.
            </motion.p>

            <motion.div variants={fadeItem}>
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-colors hover:text-[var(--saffron-light)]"
              >
                <PhoneAppIcon className="h-4 w-4 shrink-0" />
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </motion.div>

            <motion.div
              variants={fadeItem}
              className="hero-fit__actions flex flex-col sm:flex-row sm:flex-wrap sm:items-center"
            >
              <button
                onClick={onBookClick}
                className="group alive-cta inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--saffron)] hover:bg-[var(--saffron-deep)] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 sm:w-auto cursor-pointer focus:outline-none"
              >
                Book Appointment
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#treatments"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 font-semibold text-white shadow-sm ring-1 ring-white/25 backdrop-blur-md transition-all hover:bg-white/20 sm:w-auto"
              >
                Explore Treatments
              </a>
            </motion.div>

            <motion.div
              variants={fadeItem}
              className="hero-fit__stats hidden max-w-md grid-cols-3 sm:grid"
            >
              {heroStats.map(([n, l]) => (
                <div key={l} className="text-left">
                  <div className="hero-fit__stat-n font-extrabold text-white">{n}</div>
                  <div className="hero-fit__stat-l mt-0.5 font-semibold uppercase tracking-widest text-white/70">
                    {l}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          variants={fadeItem}
          initial="hidden"
          animate="show"
          className="hero-fit__stats grid grid-cols-3 rounded-2xl bg-black/25 p-3 shadow-sm ring-1 ring-white/15 backdrop-blur-md sm:hidden"
        >
          {heroStats.map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="hero-fit__stat-n font-extrabold text-white">{n}</div>
              <div className="hero-fit__stat-l mt-0.5 font-semibold uppercase tracking-widest text-white/70">
                {l}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------ ABOUT ------------------------------ */

function About() {
  return (
    <section id="about" className="about-fit relative landing-section-tone--plain">
      <div className="about-fit__shell mx-auto max-w-7xl px-4 sm:px-6">
        <div className="about-fit__grid grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="about-fit__media-wrap relative"
          >
            <div className="about-fit__media relative aspect-[4/5] lg:aspect-auto rounded-[28px] overflow-hidden shadow-[var(--shadow-elev)] ring-1 ring-black/5">
              <img
                src={aboutImg}
                alt="CorpErgo physiotherapist guiding a patient through supervised rehabilitation"
                className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.04]"
                loading="lazy"
                width={720}
                height={900}
                decoding="async"
              />
            </div>
            <motion.div
              className="about-fit__years absolute glass rounded-2xl shadow-[var(--shadow-elev)] animate-float"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.6, ease: easeOut }}
            >
              <div className="about-fit__years-n font-extrabold text-[var(--ink)]">
                <Counter to={12} />+
              </div>
              <div className="about-fit__years-l text-[var(--ink-soft)]">
                Years of hands-on physiotherapy expertise
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="about-fit__content"
          >
            <div className="about-fit__eyebrow uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
              About CorpErgo
            </div>
            <h2 className="about-fit__title font-extrabold tracking-tight text-[var(--ink)] text-balance">
              Recovery, reimagined for how you live and move.
            </h2>
            <p className="about-fit__body text-[var(--ink-soft)]">
              CorpErgo is a physiotherapy-first clinic chain built on evidence, empathy and
              outcomes. From posture correction to post-surgery rehabilitation, our team designs a
              plan for your body, your goals and your timeline.
            </p>

            <div className="about-fit__cards grid sm:grid-cols-2">
              {[
                {
                  n: "01",
                  t: "Our Mission",
                  d: "Make world-class physiotherapy accessible across Bengaluru.",
                },
                {
                  n: "02",
                  t: "Our Vision",
                  d: "A city that moves without pain â€” at any age, at any stage.",
                },
              ].map((x) => (
                <div
                  key={x.n}
                  className="about-fit__card bg-white ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]"
                >
                  <div className="about-fit__card-n font-bold text-[var(--bronze)]">{x.n}</div>
                  <div className="about-fit__card-t font-bold text-[var(--ink)]">{x.t}</div>
                  <div className="about-fit__card-d text-[var(--ink-soft)]">{x.d}</div>
                </div>
              ))}
            </div>

            <div className="about-fit__stats grid grid-cols-3">
              {[
                [<Counter to={1000} suffix="+" />, "Patients"],
                [<Counter to={5} />, "Clinics"],
                [<Counter to={98} suffix="%" />, "Satisfaction"],
              ].map(([v, l], i) => (
                <div key={i}>
                  <div className="about-fit__stat-n font-extrabold text-[var(--ink)]">{v}</div>
                  <div className="about-fit__stat-l uppercase tracking-widest text-[var(--ink-soft)]/80">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ TREATMENTS ------------------------------ */

const TREATMENTS = [
  {
    icon: Bone,
    title: "Orthopaedic Physiotherapy",
    desc: "Joint, bone & post-fracture rehabilitation.",
    image: treatmentOrthopaedic,
  },
  {
    icon: Brain,
    title: "Neurological Rehabilitation",
    desc: "Stroke, Parkinson's and nerve injury recovery.",
    image: treatmentNeurological,
  },
  {
    icon: Dumbbell,
    title: "Sports Injury Rehab",
    desc: "Return-to-sport programs for athletes.",
    image: treatmentSports,
  },
  {
    icon: Activity,
    title: "Musculoskeletal Therapy",
    desc: "Manual therapy for pain & mobility.",
    image: treatmentMusculoskeletal,
  },
  {
    icon: HeartPulse,
    title: "Women's Health",
    desc: "Pre & post-natal and pelvic floor care.",
    image: treatmentWomensHealth,
  },
  {
    icon: Baby,
    title: "Pediatric Physiotherapy",
    desc: "Gentle developmental support for children.",
    image: treatmentPediatric,
  },
  {
    icon: UserRound,
    title: "Geriatric Physiotherapy",
    desc: "Balance, strength & fall prevention.",
    image: treatmentGeriatric,
  },
  {
    icon: Stethoscope,
    title: "Post-Surgery Rehab",
    desc: "Structured recovery after operations.",
    image: treatmentPostSurgery,
  },
];

function Treatments() {
  return (
    <section id="treatments" className="landing-section relative landing-section-tone--warm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-2xl section-header"
        >
          <div className="type-eyebrow text-[var(--bronze)]">Treatments</div>
          <h2 className="type-h2 font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Specialized programs, delivered with precision.
          </h2>
          <p className="type-lead text-[var(--ink-soft)]">
            Every physiotherapy plan is built around your assessment, pain pattern, mobility goals
            and evidence-based protocols, not a template.
          </p>
        </motion.div>
        {/*
          Mobile: narrower card so the next one peeks in before any swipe.
          No opacity:0 on enter â€” peeked cards must stay visible.
        */}
        <div className="treatments-scroll mt-8 flex gap-4 overflow-x-auto overscroll-x-contain scroll-pr-4 pb-4 pr-4 snap-x snap-mandatory sm:-mr-6 sm:gap-5 sm:scroll-pr-6 sm:pr-6 md:mr-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0 md:pr-0 md:snap-none lg:grid-cols-4 lg:gap-6">
          {TREATMENTS.map(({ icon: Icon, title, desc, image }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ delay: Math.min(i, 2) * 0.04, duration: 0.45 }}
              className="group relative w-[calc(100vw-5.25rem)] max-w-[20rem] shrink-0 grow-0 snap-start rounded-3xl bg-white p-6 transition-all overflow-hidden sm:w-[20rem] md:w-auto md:max-w-none landing-card-hover site-card"
            >
              <img
                src={image}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-99"
                loading="lazy"
                width={640}
                height={800}
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/80" aria-hidden />
              <div className="relative z-10">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-[2px] group-hover:bg-[var(--sage)] group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 type-h3 font-bold text-white leading-snug">{title}</h3>
                <div className="mt-2 type-body-sm text-white/80">{desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ WHY CHOOSE ------------------------------ */

function WhyChoose() {
  const items = [
    {
      t: "Evidence-Based Treatment",
      d: "Protocols grounded in clinical research and measurable outcomes.",
    },
    {
      t: "Certified Physiotherapists",
      d: "Licensed experts with specialization in orthopaedic, neuro & sports.",
    },
    { t: "Modern Equipment", d: "Latest rehabilitation tools for faster, safer recovery." },
    { t: "Individual Care", d: "One-on-one sessions â€” never a shared or hurried appointment." },
    { t: "5 Bengaluru Clinics", d: "Chansandra, Balagere, Muthsandra, Kannamangala & Manduru." },
    { t: "Affordable Care", d: "Transparent pricing and flexible session packages." },
  ];
  return (
    <section className="landing-section relative landing-section-tone--muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-6 sm:mb-8 section-header">
          <div className="type-eyebrow text-[var(--bronze)]">Why choose CorpErgo</div>
          <h2 className="type-h2 font-extrabold tracking-tight text-[var(--ink)] text-balance">
            A different kind of physiotherapy clinic.
          </h2>
        </div>

        <div className="scrollbar-hide -mr-4 flex gap-4 overflow-x-auto scroll-pr-4 pb-2 pr-4 snap-x snap-mandatory sm:-mr-6 sm:scroll-pr-6 sm:pr-6 md:mr-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0 md:pr-0 md:snap-none lg:grid-cols-3">
          {items.map((x, i) => (
            <motion.div
              key={x.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative min-w-[17.5rem] max-w-[17.5rem] shrink-0 snap-start rounded-3xl bg-white p-7 transition-all overflow-hidden sm:min-w-[19rem] sm:max-w-[19rem] sm:p-8 md:min-w-0 md:max-w-none landing-card-hover site-card"
            >
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--sage)]/5 transition-transform duration-700" />
              <div className="relative">
                <div className="type-stat text-[var(--sage)]/25 transition-colors">0{i + 1}</div>
                <h3 className="mt-3 type-h3 font-bold text-[var(--ink)]">{x.t}</h3>
                <div className="mt-2 type-body-sm text-[var(--ink-soft)]">{x.d}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ VIDEO STORIES ------------------------------ */

const INSTAGRAM_REELS = [
  {
    id: "DaaqA0HxJ8o",
    title: "Clinic moments",
    tag: "Reel",
    thumb: reelClinicMoments,
    url: "https://www.instagram.com/reel/DaaqA0HxJ8o/",
  },
  {
    id: "DZnTwpaxLR4",
    title: "Recovery in motion",
    tag: "Reel",
    thumb: reelRecoveryMotion,
    url: "https://www.instagram.com/reel/DZnTwpaxLR4/",
  },
  {
    id: "DZEeWgSxZx7",
    title: "Patient journey",
    tag: "Reel",
    thumb: reelPatientJourney,
    url: "https://www.instagram.com/reel/DZEeWgSxZx7/",
  },
  {
    id: "DIdJ8eczP_i",
    title: "Therapy insights",
    tag: "Reel",
    thumb: reelTherapyInsights,
    url: "https://www.instagram.com/reel/DIdJ8eczP_i/",
  },
  {
    id: "DGTB4tvSuLK",
    title: "Hands-on care",
    tag: "Reel",
    thumb: reelHandsOnCare,
    url: "https://www.instagram.com/reel/DGTB4tvSuLK/",
  },
  {
    id: "DRRGSVQEsyy",
    title: "Stronger every day",
    tag: "Reel",
    thumb: reelStrongerEveryday,
    url: "https://www.instagram.com/reel/DRRGSVQEsyy/",
  },
] as const;

function VideoStories() {
  const [activeReel, setActiveReel] = useState<(typeof INSTAGRAM_REELS)[number] | null>(null);

  useEffect(() => {
    if (!activeReel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveReel(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [activeReel]);

  return (
    <section
      id="videos"
      className="landing-section relative overflow-hidden landing-section-tone--plain"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[var(--sage)]/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-[var(--bronze)]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-4">
          <div className="section-header max-w-xl">
            <div className="type-eyebrow text-[var(--bronze)]">Watch & Learn</div>
            <h2 className="type-h2 text-balance font-extrabold tracking-tight text-[var(--ink)]">
              Real recoveries. Real people.
            </h2>
            <p className="type-lead text-[var(--ink-soft)]">
              Clinic stories from CorpErgo â€” treatment moments, rehab progress, and care you can
              trust.
            </p>
          </div>
          <a
            href={INSTAGRAM_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex self-start sm:self-auto items-center gap-1.5 text-sm font-semibold text-[var(--ink)]/80 hover:text-[var(--ink)]"
          >
            <InstagramIcon className="h-4 w-4" /> Follow us
          </a>
        </div>

        <div className="scrollbar-hide -mr-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-pl-0 scroll-pr-4 pb-4 pr-4 sm:-mr-6 sm:scroll-pr-6 sm:pr-6">
          {INSTAGRAM_REELS.map((reel, i) => (
            <motion.button
              key={reel.id}
              type="button"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => setActiveReel(reel)}
              aria-label={`Play ${reel.title}`}
              className="group relative aspect-[3/4] w-[280px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-3xl bg-zinc-800 text-left shadow-lg sm:w-[340px]"
            >
              <img
                src={reel.thumb}
                alt=""
                loading="lazy"
                decoding="async"
                width={680}
                height={906}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/10" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[var(--ink)] shadow-2xl transition-transform duration-300 group-hover:scale-110">
                  <Play className="ml-1 h-6 w-6 fill-current" />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/75">
                  <InstagramIcon className="h-3.5 w-3.5" /> {reel.tag}
                </div>
                <h3 className="mt-1 type-h3 font-bold tracking-tight text-white">{reel.title}</h3>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {activeReel ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={activeReel.title}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close video"
            onClick={() => setActiveReel(null)}
          />
          <div className="relative z-10 aspect-[9/16] max-h-[min(88vh,760px)] w-full max-w-[420px] overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setActiveReel(null)}
              className="absolute top-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              key={activeReel.id}
              title={activeReel.title}
              src={`https://www.instagram.com/reel/${activeReel.id}/embed`}
              className="h-full w-full border-0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------ PHYSIOS ------------------------------ */

const TESTIMONIALS = [
  {
    name: "Anita R.",
    context: "Post-surgery knee rehab Â· Balagere",
    rating: 5,
    quote:
      "Within six weeks I went from barely bending my knee to climbing stairs without pain. The assessment was thorough and every session felt purposeful.",
  },
  {
    name: "Rahul K.",
    context: "Sports injury Â· Chansandra",
    rating: 5,
    quote:
      "CorpErgo helped me return to cricket after a shoulder injury. Clear progress tracking, honest guidance, and therapists who actually listen.",
  },
  {
    name: "Meera S.",
    context: "Neck & posture care Â· Whitefield",
    rating: 5,
    quote:
      "Years of desk work had left me with chronic neck stiffness. The manual therapy and home plan made a visible difference in the first month.",
  },
  {
    name: "Joseph T.",
    context: "Stroke rehabilitation Â· Kannamangala",
    rating: 5,
    quote:
      "The neurological rehab program restored confidence in daily movement. Professional, patient, and deeply knowledgeable at every step.",
  },
  {
    name: "Priya M.",
    context: "Women's health Â· Manduru",
    rating: 5,
    quote:
      "I felt comfortable from the first visit. The team explained everything clearly and tailored care to my post-natal recovery goals.",
  },
  {
    name: "Vikram D.",
    context: "Back pain Â· Muthsandra",
    rating: 4,
    quote:
      "Structured treatment, modern equipment, and no rushed appointments. My lower back pain is manageable again after years of ignoring it.",
  },
];

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < value
              ? "fill-[var(--saffron)] text-[var(--saffron)]"
              : "fill-black/5 text-black/10",
          )}
        />
      ))}
    </div>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="landing-section relative landing-section-tone--warm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-6 sm:mb-8 section-header">
          <div className="type-eyebrow text-[var(--bronze)]">Patient stories</div>
          <h2 className="type-h2 font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Trusted by patients across Bengaluru.
          </h2>
          <p className="type-lead text-[var(--ink-soft)]">
            Real recovery journeys from people who chose evidence-based care at CorpErgo.
          </p>
          <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-[var(--saffron-light)] px-4 py-2 ring-1 ring-[var(--saffron)]/20">
            <StarRating value={5} />
            <span className="text-sm font-bold text-[var(--ink)]">4.9 average rating</span>
            <span className="text-xs font-semibold text-[var(--ink-soft)]">Â· 500+ reviews</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 3) * 0.06, duration: 0.5 }}
              className="relative flex h-full flex-col rounded-3xl bg-white p-7 landing-card-hover site-card"
            >
              <Quote
                className="absolute right-6 top-6 h-8 w-8 text-[var(--saffron)]/15"
                aria-hidden
              />
              <StarRating value={item.rating} />
              <blockquote className="type-body-sm mt-4 flex-1 text-[var(--ink)]">
                â€œ{item.quote}â€
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-black/[0.05] pt-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--ink)] text-xs font-bold text-white">
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)]">{item.name}</div>
                  <div className="text-xs font-semibold text-[var(--ink-soft)]">{item.context}</div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CLINICS ------------------------------ */

const CLINIC_PHOTOS = [heroImg, aboutImg, reelClinicMoments, reelHandsOnCare, reelRecoveryMotion];

const CLINICS = [
  {
    name: "Chansandra",
    addr: "Chansandra Main Rd, Bengaluru",
    hours: "Monâ€“Sat Â· 8amâ€“8pm",
    mapUrl: "https://maps.app.goo.gl/w9o4N65QwY1NGkgc8",
    photo: CLINIC_PHOTOS[0],
  },
  {
    name: "Balagere",
    addr: "Balagere Rd, Varthur, Bengaluru",
    hours: "Monâ€“Sat Â· 8amâ€“8pm",
    mapUrl: "https://maps.app.goo.gl/gP8neSidun1DtXHt7",
    photo: CLINIC_PHOTOS[1],
  },
  {
    name: "Muthsandra",
    addr: "Muthsandra, Whitefield, Bengaluru",
    hours: "Monâ€“Sat Â· 8amâ€“8pm",
    mapUrl: "https://maps.app.goo.gl/N8ja8jsPgtCZkdky5",
    photo: CLINIC_PHOTOS[2],
  },
  {
    name: "Kannamangala",
    addr: "Kannamangala, Bengaluru East",
    hours: "Monâ€“Sat Â· 8amâ€“8pm",
    mapUrl: "https://maps.app.goo.gl/AoB5Cftbm3hMzW1HA",
    photo: CLINIC_PHOTOS[3],
  },
  {
    name: "Manduru",
    addr: "Manduru, Bengaluru",
    hours: "Monâ€“Sat Â· 8amâ€“8pm",
    mapUrl: "https://maps.app.goo.gl/HsFRRdwtYAqLZmoC8",
    photo: CLINIC_PHOTOS[4],
  },
];

function Clinics({ onBookClick }: { onBookClick: () => void }) {
  const n = CLINICS.length;
  const [active, setActive] = useState(0);

  const go = (dir: -1 | 1) => setActive((i) => (i + dir + n) % n);

  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > Math.floor(n / 2)) d -= n;
    if (d < -Math.floor(n / 2)) d += n;
    return d;
  };

  return (
    <section
      id="clinics"
      className="landing-section relative landing-section-tone--muted overflow-x-clip"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 max-w-3xl sm:mb-8 section-header">
          <div className="type-eyebrow text-[var(--bronze)]">Locations</div>
          <h2 className="type-h2 font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Five clinics. One standard of care.
          </h2>
          <p className="type-lead mt-3 max-w-2xl text-[var(--ink-soft)]">
            Same evidence-based physiotherapy at every CorpErgo location across Bengaluru â€” walk
            in Monâ€“Sat, 8amâ€“8pm.
          </p>
        </div>

        <div className="relative flex items-stretch gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous clinic"
            className="z-20 mt-[9.5rem] grid h-11 w-11 shrink-0 place-items-center self-start rounded-full bg-white text-[var(--ink)] shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] transition hover:bg-[var(--sage)] hover:text-white sm:mt-[10.5rem] sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative mx-auto min-h-[30rem] w-full flex-1 py-2 sm:min-h-[32rem] [--carousel-offset:22.5rem] sm:[--carousel-offset:27rem] lg:[--carousel-offset:30rem]">
            {CLINICS.map((c, i) => {
              const d = offsetOf(i);
              const visible = Math.abs(d) <= 1;
              return (
                <motion.div
                  key={c.name}
                  className="absolute left-1/2 top-1/2 w-[min(calc(100vw-6.5rem),20.5rem)] sm:w-[24rem] lg:w-[26rem]"
                  initial={false}
                  animate={{
                    x: `calc(-50% + ${d} * var(--carousel-offset))`,
                    y: "-50%",
                    scale: d === 0 ? 1 : 0.94,
                    opacity: visible ? (d === 0 ? 1 : 0.78) : 0,
                    zIndex: d === 0 ? 10 : 5 - Math.abs(d),
                    pointerEvents: d === 0 ? "auto" : "none",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  aria-hidden={!visible}
                >
                  <div
                    className={cn(
                      "group flex flex-col overflow-hidden rounded-3xl bg-white transition-all landing-card-hover site-card",
                      d === 0 ? "shadow-[var(--shadow-elev)]" : "shadow-[var(--shadow-soft)]",
                    )}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--ivory)]">
                      <img
                        src={c.photo}
                        alt={`${c.name} clinic`}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                        width={640}
                        height={400}
                        decoding="async"
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--bronze)] shadow-sm backdrop-blur-sm">
                        Clinic 0{i + 1}
                      </span>
                    </div>
                    <div className="flex flex-col p-5 sm:p-6">
                      <h3 className="type-h3 font-bold text-[var(--ink)]">{c.name}</h3>
                      <div className="mt-1.5 type-body-sm leading-relaxed text-[var(--ink-soft)]">
                        {c.addr}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-soft)]">
                        <Clock className="h-3.5 w-3.5 shrink-0" /> {c.hours}
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={onBookClick}
                          className="flex-1 rounded-full bg-[var(--saffron)] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--saffron-deep)] cursor-pointer focus:outline-none"
                        >
                          Book
                        </button>
                        <a
                          href={c.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${c.name} in Google Maps`}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ivory)] text-[var(--ink)] ring-1 ring-black/5 transition hover:bg-[var(--saffron-light)] hover:text-[var(--saffron-deep)]"
                        >
                          <GoogleMapsIcon className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next clinic"
            className="z-20 mt-[9.5rem] grid h-11 w-11 shrink-0 place-items-center self-start rounded-full bg-white text-[var(--ink)] shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] transition hover:bg-[var(--sage)] hover:text-white sm:mt-[10.5rem] sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 sm:mt-8">
          {CLINICS.map((c, i) => (
            <button
              key={c.name}
              type="button"
              aria-label={`Go to ${c.name}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active
                  ? "w-6 bg-[var(--sage)]"
                  : "w-2 bg-[var(--ink)]/20 hover:bg-[var(--ink)]/35"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FOUNDER ------------------------------ */

function Founder() {
  return (
    <section id="founder" className="founder-fit relative landing-section-tone--plain">
      <div className="founder-fit__shell mx-auto max-w-7xl px-4 sm:px-6">
        <div className="founder-fit__grid grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-8 lg:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="founder-fit__media-wrap relative"
          >
            <div className="absolute -inset-3 sm:-inset-4 rounded-[32px] bg-gradient-to-br from-[var(--sage)]/15 via-transparent to-[var(--bronze)]/20 -z-10" />
            <div className="founder-fit__media overflow-hidden rounded-[28px] shadow-[var(--shadow-elev)] ring-1 ring-black/[0.04]">
              <img
                src={pinkyImg}
                alt="Dr. Pinky Dutta PT, Head of Department at CorpErgo"
                className="aspect-[4/5] h-full w-full object-cover object-[center_18%] sm:object-[center_15%] lg:aspect-auto"
                width={640}
                height={800}
                decoding="async"
                loading="lazy"
              />
            </div>
            <div className="founder-fit__badge absolute left-4 right-4 sm:left-6 sm:right-auto rounded-2xl bg-white/95 backdrop-blur-md shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
              <div className="founder-fit__badge-kicker uppercase tracking-[0.18em] font-bold text-[var(--bronze)]">
                Founder of CorpErgo
              </div>
              <div className="founder-fit__badge-copy font-bold text-[var(--ink)] leading-snug">
                Leading care across Bengaluru
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="founder-fit__content"
          >
            <div className="founder-fit__eyebrow uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
              Leadership
            </div>
            <h2 className="founder-fit__title font-extrabold tracking-tight text-[var(--ink)] text-balance">
              Care that starts with clinical conviction.
            </h2>

            <div className="founder-fit__quote relative pl-1">
              <Quote
                className="founder-fit__quote-mark absolute -left-1 -top-1 text-[var(--sage)]/15"
                aria-hidden
              />
              <blockquote className="founder-fit__quote-text relative font-medium text-[var(--ink)] text-balance pl-8">
                â€œPain is only the beginning of the story. At CorpErgo, we restore movement,
                rebuild confidence, and walk with every patient until they feel strong in their own
                body again.â€
              </blockquote>
            </div>

            <div className="founder-fit__meta flex flex-col sm:flex-row sm:items-end">
              <div>
                <div className="founder-fit__name font-extrabold tracking-tight text-[var(--ink)]">
                  Dr. Pinky Dutta PT
                </div>
                <div className="founder-fit__role font-semibold text-[var(--ink-soft)]">
                  Head of the Department
                </div>
                <div className="founder-fit__specialty text-[var(--ink-soft)]/80">
                  Musculoskeletal &amp; Sports Physiotherapist
                </div>
              </div>
              <div className="founder-fit__divider hidden sm:block bg-[var(--ink)]/10" />
              <p className="founder-fit__clinics text-[var(--ink-soft)] max-w-xs">
                Owner of CorpErgoâ€™s five Bengaluru clinics â€” Chansandra, Balagere, Muthsandra,
                Kannamangala &amp; Manduru.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FAQ ------------------------------ */

const FAQ_ITEMS = [
  {
    question: "Do I need a doctor's referral to book?",
    answer:
      "No referral is required for your first assessment. If you have reports, prescriptions, or imaging from your doctor, bring them along â€” they help us plan care faster.",
  },
  {
    question: "What happens at the first visit?",
    answer:
      "A certified physiotherapist will review your history, assess movement and pain, explain findings in plain language, and outline a personalised treatment plan with clear next steps.",
  },
  {
    question: "How long is a typical session?",
    answer:
      "Most sessions run 45â€“60 minutes depending on your condition and treatment plan. Follow-up visits may be shorter once your programme is established.",
  },
  {
    question: "Which CorpErgo clinic should I choose?",
    answer:
      "Pick the location closest to you â€” Chansandra, Balagere, Muthsandra, Kannamangala, or Manduru. Every clinic follows the same evidence-based standards of care.",
  },
  {
    question: "Where are CorpErgo physiotherapy clinics near me in Bengaluru?",
    answer:
      "CorpErgo has physiotherapy clinics in Chansandra, Balagere, Muthsandra, Kannamangala, and Manduru, serving Whitefield, Varthur, Bengaluru East, and nearby areas.",
  },
  {
    question: "Do you treat back pain, neck pain, knee pain, and posture problems?",
    answer:
      "Yes. CorpErgo physiotherapists assess posture, strength, mobility, and pain triggers, then create a treatment and exercise plan for back, neck, knee, shoulder, and other musculoskeletal problems.",
  },
  {
    question: "Can I book online or by phone?",
    answer:
      "Yes. Book directly on our website without logging in, or sign in to your patient portal to manage appointments. You can also call us and our team will help you schedule.",
  },
  {
    question: "Do you treat sports injuries and post-surgery rehab?",
    answer:
      "Yes. We offer sports injury rehabilitation, orthopaedic recovery, neurological rehab, women's health, paediatric care, and structured post-operative programmes.",
  },
  {
    question: "What should I wear and bring?",
    answer:
      "Wear comfortable clothing that allows easy movement. Bring a valid ID, any medical reports or scans, and a list of current medications if relevant.",
  },
] as const;

function FAQ({ onBookClick }: { onBookClick: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="landing-section relative landing-section-tone--plain">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="section-header max-w-md lg:sticky lg:top-28"
          >
            <div className="type-eyebrow text-[var(--bronze)]">FAQ</div>
            <h2 className="type-h2 font-extrabold tracking-tight text-[var(--ink)] text-balance">
              Common questions, answered clearly.
            </h2>
            <p className="type-lead text-[var(--ink-soft)]">
              Everything you need to know before your first visit â€” booking, sessions, clinics,
              and what to expect from CorpErgo care.
            </p>
            <button
              type="button"
              onClick={onBookClick}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--saffron-deep)] cursor-pointer focus:outline-none"
            >
              Book an assessment
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <motion.div
                  key={item.question}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: Math.min(i, 3) * 0.05, duration: 0.4 }}
                  className="site-card overflow-hidden rounded-2xl bg-white transition-colors"
                >
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--saffron-light)]/40 sm:px-6 sm:py-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron)]/40 focus-visible:ring-inset"
                  >
                    <span className="type-h4 font-bold text-[var(--ink)] leading-snug">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0 text-[var(--saffron-deep)] transition-transform duration-300",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="type-body-sm border-t border-black/[0.06] px-5 pb-5 pt-0 text-[var(--ink-soft)] sm:px-6 sm:pb-6">
                        <span className="block pt-3">{item.answer}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CTA ------------------------------ */

function CTA({ onBookClick }: { onBookClick: () => void }) {
  return (
    <section id="book" className="landing-section landing-section-tone--muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, ease: easeOut }}
          className="relative overflow-hidden rounded-[36px] border-[3px] border-black/25 p-10 sm:p-16 lg:p-20 grain bg-[var(--structure-maroon)]"
        >
          <div className="alive-orb alive-orb--cta-a absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="alive-orb alive-orb--cta-b absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--saffron)]/20 blur-3xl" />
          <div
            className="pointer-events-none absolute right-6 top-1/2 z-0 hidden -translate-y-1/2 lg:block xl:right-10 2xl:right-14"
            aria-hidden
          >
            <CorpErgoLogo
              size="xl"
              background="dark"
              withFrame={false}
              className="h-56 w-auto max-w-none lg:h-72 xl:h-[22rem] 2xl:h-[26rem] opacity-[0.09]"
            />
          </div>
          <div className="relative z-10 max-w-3xl">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeItem} className="type-eyebrow text-white/80 font-bold">
                Ready when you are
              </motion.div>
              <motion.h2
                variants={fadeItem}
                className="type-display mt-3 font-extrabold tracking-tight text-white drop-shadow-md text-balance"
              >
                Ready to start your recovery journey?
              </motion.h2>
              <motion.p
                variants={fadeItem}
                className="type-lead mt-4 text-white/90 font-medium max-w-xl"
              >
                Book a first assessment with a certified CorpErgo physiotherapist â€” at the clinic
                closest to you.
              </motion.p>
              <motion.div variants={fadeItem} className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={onBookClick}
                  className="group alive-cta inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[var(--structure-maroon)] hover:bg-[var(--ivory)] transition-all hover:-translate-y-0.5 shadow-xl cursor-pointer focus:outline-none"
                >
                  Book Appointment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/30 hover:bg-white/20 transition-all"
                >
                  <PhoneAppIcon className="h-4 w-4" /> Call us
                </a>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------ FOOTER ------------------------------ */

function Footer({ onBookClick }: { onBookClick: () => void }) {
  return (
    <footer
      id="contact"
      className="border-t border-black/[0.06] bg-[#f7f6f3] text-[var(--ink-soft)]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <CorpErgoLogo size="md" withFrame={false} className="h-14 w-auto sm:h-[3.75rem]" />
              <div>
                <div className="corpergo-brand-title type-h4 text-[var(--ink)]">
                  <span className="text-[var(--saffron)]">Corp</span>Ergo
                </div>
                <div className="corpergo-brand-tagline">Physiotherapy &amp; Rehabilitation</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              Evidence-based physiotherapy across five Bengaluru clinics â€” pain relief, mobility,
              and long-term wellness.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={INSTAGRAM_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[var(--ink)] ring-1 ring-black/[0.08] transition hover:ring-[var(--saffron)]/40"
                aria-label="CorpErgo on Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
                Instagram
              </a>
              <a
                href={YOUTUBE_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[var(--ink)] ring-1 ring-black/[0.08] transition hover:ring-[var(--saffron)]/40"
                aria-label="CorpErgo on YouTube"
              >
                <YouTubeIcon className="h-4 w-4" />
                YouTube
              </a>
              <a
                href={FACEBOOK_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[var(--ink)] ring-1 ring-black/[0.08] transition hover:ring-[var(--saffron)]/40"
                aria-label="CorpErgo on Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
                Facebook
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
              Quick links
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Treatments", "About", "FAQ", "Testimonials", "Clinics", "Book Appointment"].map(
                (x) => (
                  <li key={x}>
                    <a
                      href={
                        x === "Book Appointment"
                          ? "#"
                          : x === "Testimonials"
                            ? "#testimonials"
                            : x === "FAQ"
                              ? "#faq"
                              : `#${x.toLowerCase()}`
                      }
                      onClick={(e) => {
                        if (x === "Book Appointment") {
                          e.preventDefault();
                          onBookClick();
                        }
                      }}
                      className="transition-colors hover:text-[var(--saffron-deep)]"
                    >
                      {x}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
              Branches
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {CLINICS.map((c) => (
                <li key={c.name}>
                  <a
                    href={c.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition-colors hover:text-[var(--saffron-deep)]"
                  >
                    <GoogleMapsIcon className="h-3.5 w-3.5 shrink-0" /> {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
              Contact
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <PhoneAppIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="transition-colors hover:text-[var(--saffron-deep)]"
                >
                  {SUPPORT_PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <GmailIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="transition-colors hover:text-[var(--saffron-deep)]"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--saffron)]" /> Monâ€“Sat Â·
                8amâ€“8pm
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-black/[0.06] pt-6 text-xs sm:flex-row">
          <div>
            &copy; {new Date().getFullYear()} CorpErgo Physiotherapy. All rights reserved. Powered
            by{" "}
            <a
              href="https://northnode.live"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--ink)] transition-colors hover:text-[var(--saffron-deep)]"
            >
              NorthNode
            </a>
          </div>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition-colors hover:text-[var(--ink)]">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-[var(--ink)]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FloatingBackgroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-[var(--canvas-bg)]">
      <div className="relative z-10 text-[var(--ink)]">{children}</div>
    </section>
  );
}

function BookingChoiceModal({
  isOpen,
  onClose,
  onDirectBook,
  onLoginFirst,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDirectBook: () => void;
  onLoginFirst: () => void;
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-xl overflow-hidden rounded-3xl border-none bg-white p-0 shadow-2xl">
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)]">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="type-h2 font-extrabold tracking-tight text-[var(--ink)]">
                Book appointment
              </h2>
              <p className="type-body-sm mt-1 text-[var(--ink-soft)]">
                Choose the fastest path for today.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onDirectBook}
              className="group flex min-h-44 flex-col rounded-3xl bg-[var(--ivory)] p-5 text-left shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--saffron-light)] hover:shadow-[0_12px_32px_rgba(255,152,0,0.18)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--pink-main)] text-white transition-transform duration-200 group-hover:scale-105">
                <PhoneAppIcon className="h-5 w-5" />
              </span>
              <span className="type-h3 mt-4 font-extrabold text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--ink)]">
                Book directly
              </span>
              <span className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)] transition-colors duration-200 group-hover:text-[var(--ink)]/85">
                Name, mobile, gender, age and clinic. The clinic will call to confirm.
              </span>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-[var(--pink-main)] transition-colors duration-200 group-hover:text-[var(--saffron-deep)]">
                Continue{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={onLoginFirst}
              className="group flex min-h-44 flex-col rounded-3xl bg-white p-5 text-left shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--sage)]/12 hover:shadow-[0_12px_32px_rgba(255,152,0,0.14)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--sage)] text-white transition-transform duration-200 group-hover:scale-105">
                <LogIn className="h-5 w-5" />
              </span>
              <span className="type-h3 mt-4 font-extrabold text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--ink)]">
                Login first and book
              </span>
              <span className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)] transition-colors duration-200 group-hover:text-[var(--ink)]/85">
                Get dashboard tracking, QR ticket updates, reports and assessments.
              </span>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-[var(--sage-deep)] transition-colors duration-200 group-hover:text-[var(--saffron-deep)]">
                Login and continue{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[var(--sage)]/10 px-4 py-3 text-xs font-semibold text-[var(--sage-deep)]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Direct requests do not show patient accept or reject actions; clinic staff confirm by
            phone.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ PAGE ------------------------------ */

export function LandingPage() {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isBookingChoiceOpen, setIsBookingChoiceOpen] = useState(false);
  const [patientRedirectTo, setPatientRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("login") === "true"
    ) {
      setIsLoginOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLoginClick = () => {
    setPatientRedirectTo(null);
    setIsLoginOpen(true);
  };

  const handleBookClick = () => {
    setIsBookingChoiceOpen(true);
  };

  const handleDirectBook = () => {
    setIsBookingChoiceOpen(false);
    void navigate({ to: "/direct-booking" });
  };

  const handleLoginFirst = () => {
    setIsBookingChoiceOpen(false);
    setPatientRedirectTo("/patient/book");
    setIsLoginOpen(true);
  };

  return (
    <main className="relative overflow-x-clip home-page-main">
      <AmbientOrbs />
      <Nav onLoginClick={handleLoginClick} onBookClick={handleBookClick} />
      <Hero onBookClick={handleBookClick} />
      <FloatingBackgroundLayout>
        <MotionMarquee />
        <About />
        <Treatments />
        <Founder />
        <WhyChoose />
        <VideoStories />
        <Testimonials />
        <Clinics onBookClick={handleBookClick} />
        <FAQ onBookClick={handleBookClick} />
        <CTA onBookClick={handleBookClick} />
      </FloatingBackgroundLayout>
      <Footer onBookClick={handleBookClick} />

      <BookingChoiceModal
        isOpen={isBookingChoiceOpen}
        onClose={() => setIsBookingChoiceOpen(false)}
        onDirectBook={handleDirectBook}
        onLoginFirst={handleLoginFirst}
      />
      <Suspense fallback={null}>
        {isLoginOpen ? (
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            patientRedirectTo={patientRedirectTo}
          />
        ) : null}
      </Suspense>
    </main>
  );
}
