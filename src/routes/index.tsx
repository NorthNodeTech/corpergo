import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useMotionValue, animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Sparkles,
  Play,
  Instagram,
  Facebook,
  Youtube,
  Menu,
  X,
  Quote,
  CalendarPlus,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { CorpErgoLogo } from "@/components/CorpErgoLogo";
import heroImg from "@/assets/corpergo hero sec.png";
import aboutImg from "@/assets/abt.webp";
import pinkyImg from "@/assets/Pinkyce.webp";
import reelClinicMoments from "@/assets/reels/reel-clinic-moments.webp";
import reelHandsOnCare from "@/assets/reels/reel-hands-on-care.webp";
import reelRecoveryMotion from "@/assets/reels/reel-recovery-motion.webp";
import reelPatientJourney from "@/assets/reels/reel-patient-journey.webp";
import reelTherapyInsights from "@/assets/reels/reel-therapy-insights.webp";
import reelStrongerEveryday from "@/assets/reels/reel-stronger-everyday.webp";
import { LoginModal } from "@/components/auth/LoginModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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

const SUPPORT_PHONE = "+911234567890";
const SUPPORT_PHONE_DISPLAY = "+91 12345 67890";

const LANDING_NAV_LINK =
  "landing-nav__link inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-3.5 py-2 text-sm font-semibold leading-snug text-white shadow-sm transition-colors hover:bg-[var(--saffron)] hover:!text-white";

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
            "landing-nav__shell relative flex min-h-12 min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl px-2.5 py-2 transition-all duration-300 sm:min-h-[3.35rem] sm:gap-3 sm:px-3",
            "lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-x-3 xl:gap-x-4",
            scrolled && "landing-nav__shell--light",
            !scrolled && onHero && "landing-nav__shell--hero",
            !scrolled && !onHero && "landing-nav__shell--light",
          )}
        >
          <Link
            to="/"
            className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--saffron)]/40 focus-visible:ring-offset-2 rounded-xl"
            aria-label="CorpErgo Physiotherapy and Rehabilitation — Home"
          >
            <CorpErgoLogo
              size="xs"
              withFrame={false}
              eTone={onHero ? "light" : "dark"}
              className="h-10 w-10 shrink-0 object-cover object-top transition-transform duration-300 group-hover:scale-[1.03] sm:h-11 sm:w-11"
            />
            <div className="min-w-0 leading-none">
              <div
                className={cn(
                  "corpergo-brand-title landing-nav__brand-title truncate text-sm sm:text-[15px]",
                  onHero ? "text-white" : "text-[var(--ink)]",
                )}
              >
                <span className="text-[var(--saffron)]">Corp</span>
                <span className={onHero ? "text-white" : "text-[var(--ink)]"}>Ergo</span>
              </div>
              <div
                className={cn(
                  "corpergo-brand-tagline landing-nav__brand-tagline mt-0.5 truncate text-[9px] sm:text-[10px] lg:text-[11px]",
                  onHero ? "text-[var(--saffron-light)]" : "text-[var(--saffron-deep)]",
                )}
              >
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
              className="group hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--saffron)] px-3.5 py-2 text-sm font-semibold leading-snug text-white shadow-sm transition-colors hover:bg-[var(--saffron-deep)] hover:text-white cursor-pointer focus:outline-none"
            >
              <span>
                Book<span className="hidden md:inline"> Appointment</span>
              </span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
            className="lg:hidden mt-2 landing-nav__shell landing-nav__shell--light rounded-2xl p-1.5"
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
              rehabilitation, sports injuries and long-term wellness — delivered by certified
              physiotherapists.
            </motion.p>

            <motion.div variants={fadeItem}>
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition-colors hover:text-[var(--saffron-light)]"
              >
                <Phone className="h-4 w-4 shrink-0 text-[var(--saffron)]" />
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
    <section id="about" className="about-fit relative">
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
                alt="Physiotherapist working with a patient"
                className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.04]"
                loading="lazy"
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
                  d: "A city that moves without pain — at any age, at any stage.",
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
  },
  {
    icon: Brain,
    title: "Neurological Rehabilitation",
    desc: "Stroke, Parkinson's and nerve injury recovery.",
  },
  { icon: Dumbbell, title: "Sports Injury Rehab", desc: "Return-to-sport programs for athletes." },
  { icon: Activity, title: "Musculoskeletal Therapy", desc: "Manual therapy for pain & mobility." },
  { icon: HeartPulse, title: "Women's Health", desc: "Pre & post-natal and pelvic floor care." },
  {
    icon: Baby,
    title: "Pediatric Physiotherapy",
    desc: "Gentle developmental support for children.",
  },
  {
    icon: UserRound,
    title: "Geriatric Physiotherapy",
    desc: "Balance, strength & fall prevention.",
  },
  { icon: Stethoscope, title: "Post-Surgery Rehab", desc: "Structured recovery after operations." },
];

function Treatments() {
  return (
    <section id="treatments" className="landing-section relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
            Treatments
          </div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Specialized programs, delivered with precision.
          </h2>
          <p className="mt-4 text-lg text-[var(--ink-soft)]">
            Every plan is built around your assessment, your goals and evidence-based protocols —
            not a template.
          </p>
        </motion.div>
        {/*
          Mobile: narrower card so the next one peeks in before any swipe.
          No opacity:0 on enter — peeked cards must stay visible.
        */}
        <div className="treatments-scroll mt-8 flex gap-4 overflow-x-auto overscroll-x-contain scroll-pr-4 pb-4 pr-4 snap-x snap-mandatory sm:-mr-6 sm:gap-5 sm:scroll-pr-6 sm:pr-6 md:mr-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0 md:pr-0 md:snap-none lg:grid-cols-4 lg:gap-6">
          {TREATMENTS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 1, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ delay: Math.min(i, 2) * 0.04, duration: 0.45 }}
              className="group relative w-[calc(100vw-5.25rem)] max-w-[20rem] shrink-0 grow-0 snap-start rounded-3xl bg-[var(--ivory)] p-6 border-2 border-transparent shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elev)] transition-all overflow-hidden sm:w-[20rem] md:w-auto md:max-w-none landing-card-hover"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)] group-hover:bg-[var(--sage)] group-hover:text-white transition-colors">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-5 text-lg font-bold text-[var(--ink)] leading-snug">{title}</div>
              <div className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">{desc}</div>
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
    { t: "Individual Care", d: "One-on-one sessions — never a shared or hurried appointment." },
    { t: "5 Bengaluru Clinics", d: "Chansandra, Balagere, Muthsandra, Kannamangala & Manduru." },
    { t: "Affordable Care", d: "Transparent pricing and flexible session packages." },
  ];
  return (
    <section className="landing-section relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-6 sm:mb-8">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
            Why choose CorpErgo
          </div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
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
              className="relative min-w-[17.5rem] max-w-[17.5rem] shrink-0 snap-start rounded-3xl p-7 bg-white/90 ring-1 ring-black/[0.04] border border-black/[0.04] transition-all shadow-[var(--shadow-soft)] overflow-hidden sm:min-w-[19rem] sm:max-w-[19rem] sm:p-8 md:min-w-0 md:max-w-none"
            >
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--sage)]/5 transition-transform duration-700" />
              <div className="relative">
                <div className="text-5xl font-extrabold text-[var(--sage)]/25 transition-colors">
                  0{i + 1}
                </div>
                <div className="mt-4 text-xl font-bold text-[var(--ink)]">{x.t}</div>
                <div className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">{x.d}</div>
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

const INSTAGRAM_PROFILE = "https://www.instagram.com/corpergophysiorehab.in/";

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
    <section id="videos" className="landing-section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[var(--sage)]/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-64 w-64 rounded-full bg-[var(--bronze)]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--bronze)]">
              Watch & Learn
            </div>
            <h2 className="mt-3 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl text-[var(--ink)]">
              Real recoveries. Real people.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
              Clinic stories from CorpErgo — treatment moments, rehab progress, and care you can
              trust.
            </p>
          </div>
          <a
            href={INSTAGRAM_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex self-start sm:self-auto items-center gap-1.5 text-sm font-semibold text-[var(--ink)]/80 hover:text-[var(--ink)]"
          >
            <Instagram className="h-4 w-4" /> Follow us
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
              className="group relative aspect-[3/4] w-[280px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-3xl bg-zinc-800 text-left sm:w-[340px]"
            >
              <img
                src={reel.thumb}
                alt=""
                loading="lazy"
                decoding="async"
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
                  <Instagram className="h-3.5 w-3.5" /> {reel.tag}
                </div>
                <div className="mt-1 text-xl font-bold tracking-tight text-white">{reel.title}</div>
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
    context: "Post-surgery knee rehab · Balagere",
    rating: 5,
    quote:
      "Within six weeks I went from barely bending my knee to climbing stairs without pain. The assessment was thorough and every session felt purposeful.",
  },
  {
    name: "Rahul K.",
    context: "Sports injury · Chansandra",
    rating: 5,
    quote:
      "CorpErgo helped me return to cricket after a shoulder injury. Clear progress tracking, honest guidance, and therapists who actually listen.",
  },
  {
    name: "Meera S.",
    context: "Neck & posture care · Whitefield",
    rating: 5,
    quote:
      "Years of desk work had left me with chronic neck stiffness. The manual therapy and home plan made a visible difference in the first month.",
  },
  {
    name: "Joseph T.",
    context: "Stroke rehabilitation · Kannamangala",
    rating: 5,
    quote:
      "The neurological rehab program restored confidence in daily movement. Professional, patient, and deeply knowledgeable at every step.",
  },
  {
    name: "Priya M.",
    context: "Women's health · Manduru",
    rating: 5,
    quote:
      "I felt comfortable from the first visit. The team explained everything clearly and tailored care to my post-natal recovery goals.",
  },
  {
    name: "Vikram D.",
    context: "Back pain · Muthsandra",
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
            i < value ? "fill-[var(--saffron)] text-[var(--saffron)]" : "fill-black/5 text-black/10",
          )}
        />
      ))}
    </div>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="landing-section relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-6 sm:mb-8">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
            Patient stories
          </div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Trusted by patients across Bengaluru.
          </h2>
          <p className="mt-4 text-lg text-[var(--ink-soft)]">
            Real recovery journeys from people who chose evidence-based care at CorpErgo.
          </p>
          <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-[var(--saffron-light)] px-4 py-2 ring-1 ring-[var(--saffron)]/20">
            <StarRating value={5} />
            <span className="text-sm font-bold text-[var(--ink)]">4.9 average rating</span>
            <span className="text-xs font-semibold text-[var(--ink-soft)]">· 500+ reviews</span>
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
              className="relative flex h-full flex-col rounded-3xl bg-white p-7 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)] landing-card-hover"
            >
              <Quote className="absolute right-6 top-6 h-8 w-8 text-[var(--saffron)]/15" aria-hidden />
              <StarRating value={item.rating} />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-[var(--ink)]">
                “{item.quote}”
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
    hours: "Mon–Sat · 8am–8pm",
    mapUrl: "https://maps.app.goo.gl/w9o4N65QwY1NGkgc8",
    photos: [CLINIC_PHOTOS[0], CLINIC_PHOTOS[1], CLINIC_PHOTOS[2]],
  },
  {
    name: "Balagere",
    addr: "Balagere Rd, Varthur, Bengaluru",
    hours: "Mon–Sat · 8am–8pm",
    mapUrl: "https://maps.app.goo.gl/gP8neSidun1DtXHt7",
    photos: [CLINIC_PHOTOS[1], CLINIC_PHOTOS[2], CLINIC_PHOTOS[3]],
  },
  {
    name: "Muthsandra",
    addr: "Muthsandra, Whitefield, Bengaluru",
    hours: "Mon–Sat · 8am–8pm",
    mapUrl: "https://maps.app.goo.gl/N8ja8jsPgtCZkdky5",
    photos: [CLINIC_PHOTOS[2], CLINIC_PHOTOS[3], CLINIC_PHOTOS[4]],
  },
  {
    name: "Kannamangala",
    addr: "Kannamangala, Bengaluru East",
    hours: "Mon–Sat · 8am–8pm",
    mapUrl: "https://maps.app.goo.gl/AoB5Cftbm3hMzW1HA",
    photos: [CLINIC_PHOTOS[3], CLINIC_PHOTOS[4], CLINIC_PHOTOS[0]],
  },
  {
    name: "Manduru",
    addr: "Manduru, Bengaluru",
    hours: "Mon–Sat · 8am–8pm",
    mapUrl: "https://maps.app.goo.gl/HsFRRdwtYAqLZmoC8",
    photos: [CLINIC_PHOTOS[4], CLINIC_PHOTOS[0], CLINIC_PHOTOS[1]],
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
    <section id="clinics" className="landing-section relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 max-w-2xl sm:mb-8">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
            Locations
          </div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Five clinics. One standard of care.
          </h2>
        </div>

        <div className="relative flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous clinic"
            className="z-20 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[var(--ink)] shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] transition hover:bg-[var(--sage)] hover:text-white sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative mx-auto h-[460px] w-full max-w-6xl px-1 sm:h-[520px] [--carousel-offset:13.5rem] sm:[--carousel-offset:22rem] lg:[--carousel-offset:28rem]">
            {CLINICS.map((c, i) => {
              const d = offsetOf(i);
              const visible = Math.abs(d) <= 1;
              return (
                <motion.div
                  key={c.name}
                  className="absolute left-1/2 top-1/2 w-[min(calc(100vw-3rem),21rem)] sm:w-[26rem] lg:w-[30rem]"
                  initial={false}
                  animate={{
                    x: `calc(-50% + ${d} * var(--carousel-offset))`,
                    y: "-50%",
                    scale: d === 0 ? 1 : 0.88,
                    opacity: visible ? (d === 0 ? 1 : 0.55) : 0,
                    zIndex: d === 0 ? 10 : 5 - Math.abs(d),
                    pointerEvents: d === 0 ? "auto" : "none",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  aria-hidden={!visible}
                >
                  <div
                    className={`group rounded-3xl bg-white p-5 sm:p-7 border-2 border-transparent transition-all landing-card-hover ${
                      d === 0 ? "shadow-[var(--shadow-elev)]" : "shadow-[var(--shadow-soft)]"
                    }`}
                  >
                    <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-2xl">
                      {c.photos.map((photo, pi) => (
                        <div
                          key={`${c.name}-photo-${pi}`}
                          className={cn(
                            "overflow-hidden bg-[var(--ivory)]",
                            pi === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-square",
                          )}
                        >
                          <img
                            src={photo}
                            alt={`${c.name} clinic ${pi + 1}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--saffron-light)] text-[var(--saffron-deep)]">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--bronze)]">
                        Clinic 0{i + 1}
                      </span>
                    </div>
                    <div className="mt-4 text-xl font-bold text-[var(--ink)]">{c.name}</div>
                    <div className="mt-1.5 text-sm leading-relaxed text-[var(--ink-soft)]">
                      {c.addr}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-soft)]">
                      <Clock className="h-3.5 w-3.5" /> {c.hours}
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
                        <MapPin className="h-4 w-4" />
                      </a>
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
            className="z-20 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[var(--ink)] shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] transition hover:bg-[var(--sage)] hover:text-white sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
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
    <section id="founder" className="founder-fit relative">
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
                “Pain is only the beginning of the story. At CorpErgo, we restore movement, rebuild
                confidence, and walk with every patient until they feel strong in their own body
                again.”
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
                Owner of CorpErgo’s five Bengaluru clinics — Chansandra, Balagere, Muthsandra,
                Kannamangala &amp; Manduru.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CTA ------------------------------ */

function CTA({ onBookClick }: { onBookClick: () => void }) {
  return (
    <section id="book" className="landing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, ease: easeOut }}
          className="relative overflow-hidden rounded-[36px] p-10 sm:p-16 lg:p-20 border-2 border-[var(--structure-maroon)] grain bg-[var(--structure-maroon)]"
        >
          <div className="alive-orb alive-orb--cta-a absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="alive-orb alive-orb--cta-b absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--saffron)]/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.div
                variants={fadeItem}
                className="text-xs uppercase tracking-[0.22em] text-white/80 font-bold"
              >
                Ready when you are
              </motion.div>
              <motion.h2
                variants={fadeItem}
                className="mt-4 text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-md text-balance leading-[1.05]"
              >
                Ready to start your recovery journey?
              </motion.h2>
              <motion.p
                variants={fadeItem}
                className="mt-5 text-lg text-white/90 font-medium max-w-xl"
              >
                Book a first assessment with a certified CorpErgo physiotherapist — at the clinic
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
                  <Phone className="h-4 w-4" /> Call us
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
    <footer id="contact" className="border-t border-black/[0.06] bg-[#f7f6f3] text-[var(--ink-soft)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <CorpErgoLogo size="md" withFrame={false} className="h-14 w-auto sm:h-[3.75rem]" />
              <div>
                <div className="corpergo-brand-title text-lg text-[var(--ink)] sm:text-xl">
                  <span className="text-[var(--saffron)]">Corp</span>Ergo
                </div>
                <div className="corpergo-brand-tagline text-[10px] text-[var(--ink-soft)] sm:text-[11px]">
                  Physiotherapy &amp; Rehabilitation
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">
              Evidence-based physiotherapy across five Bengaluru clinics — pain relief, mobility,
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
                <Instagram className="h-4 w-4 text-[var(--saffron)]" />
                Instagram
              </a>
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--ink-soft)] ring-1 ring-black/[0.08] transition hover:text-[var(--saffron)] hover:ring-[var(--saffron)]/30"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--ink-soft)] ring-1 ring-black/[0.08] transition hover:text-[var(--saffron)] hover:ring-[var(--saffron)]/30"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
              Quick links
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["Treatments", "About", "Testimonials", "Clinics", "Book Appointment"].map((x) => (
                <li key={x}>
                  <a
                    href={
                      x === "Book Appointment"
                        ? "#"
                        : x === "Testimonials"
                          ? "#testimonials"
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
              ))}
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
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--saffron)]" /> {c.name}
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
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--saffron)]" /> {SUPPORT_PHONE_DISPLAY}
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--saffron)]" /> care@corpergo.in
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--saffron)]" /> Mon–Sat ·
                8am–8pm
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-black/[0.06] pt-6 text-xs sm:flex-row">
          <div>© {new Date().getFullYear()} CorpErgo Physiotherapy. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="transition-colors hover:text-[var(--ink)]">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-[var(--ink)]">
              Terms
            </a>
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
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                Book appointment
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">
                Choose the fastest path for today.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onDirectBook}
              className="group flex min-h-44 flex-col rounded-3xl border-[3px] border-[var(--card-border-strong)] bg-[var(--ivory)] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--saffron)] hover:bg-[var(--saffron-light)] hover:shadow-[0_12px_32px_rgba(255,152,0,0.18)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--pink-main)] text-white transition-transform duration-200 group-hover:scale-105">
                <Phone className="h-5 w-5" />
              </span>
              <span className="mt-4 text-lg font-extrabold text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--ink)]">
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
              className="group flex min-h-44 flex-col rounded-3xl border-[3px] border-[var(--card-border-strong)] bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--sage-deep)] hover:bg-[var(--sage)]/12 hover:shadow-[0_12px_32px_rgba(255,152,0,0.14)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--sage)] text-white transition-transform duration-200 group-hover:scale-105">
                <LogIn className="h-5 w-5" />
              </span>
              <span className="mt-4 text-lg font-extrabold text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--ink)]">
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

function LandingPage() {
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
        <CTA onBookClick={handleBookClick} />
      </FloatingBackgroundLayout>
      <Footer onBookClick={handleBookClick} />

      <BookingChoiceModal
        isOpen={isBookingChoiceOpen}
        onClose={() => setIsBookingChoiceOpen(false)}
        onDirectBook={handleDirectBook}
        onLoginFirst={handleLoginFirst}
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        patientRedirectTo={patientRedirectTo}
      />
    </main>
  );
}
