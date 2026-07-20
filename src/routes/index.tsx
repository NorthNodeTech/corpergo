import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useMotionValue, animate } from "framer-motion";
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
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Check,
  ShieldCheck,
  Sparkles,
  Play,
  Instagram,
  Facebook,
  Youtube,
  Menu,
  X,
  Quote,
} from "lucide-react";
import logoImg from "@/assets/LOGO.png";
import heroImg from "@/assets/hero-physio.jpg";
import aboutImg from "@/assets/about-physio.jpg";
import pinkyImg from "@/assets/Pinkyce.png";

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

/* ------------------------------ helpers ------------------------------ */

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  useEffect(() => {
    const controls = animate(mv, to, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.floor(v).toLocaleString() + suffix;
      },
    });
    return () => controls.stop();
  }, [mv, to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
} as const;

/* ------------------------------ NAV ------------------------------ */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const items = [
    ["Treatments", "#treatments"],
    ["About", "#about"],
    ["Clinics", "#clinics"],
    ["Testimonials", "#testimonials"],
    ["Contact", "#contact"],
  ];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 transition-all duration-500 ${
          scrolled ? "" : ""
        }`}
      >
        <div
          className={`flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-500 ${
            scrolled
              ? "glass shadow-[var(--shadow-soft)]"
              : "bg-transparent"
          }`}
        >
          <Link
            to="/"
            className="group flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/40 focus-visible:ring-offset-2 rounded-lg"
            aria-label="CorpErgo Physiotherapy — Home"
          >
            <img
              src={logoImg}
              alt="CorpErgo"
              className="h-11 w-auto sm:h-12 object-contain object-left transition-opacity duration-300 group-hover:opacity-90"
              width={48}
              height={48}
              decoding="async"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {items.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="relative px-4 py-2 text-sm font-medium text-[var(--ink)]/80 hover:text-[var(--sage-deep)] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--ink)]/80 hover:text-[var(--sage-deep)] transition-colors"
            >
              Login
            </Link>
            <a
              href="#book"
              className="group inline-flex items-center gap-1.5 rounded-full bg-[var(--sage)] px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] hover:bg-[var(--sage-deep)] transition-all hover:shadow-[var(--shadow-elev)] hover:-translate-y-0.5"
            >
              Book Appointment
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden grid h-10 w-10 place-items-center rounded-xl bg-white/60 ring-1 ring-black/5"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden mt-2 rounded-2xl glass p-2"
          >
            {items.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-[var(--ink)]/80 hover:bg-white/50 rounded-xl"
              >
                {label}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

/* ------------------------------ HERO ------------------------------ */

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 80]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-16 grain">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[var(--sage)]/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[var(--teal)]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-[var(--bronze)]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <motion.div style={{ y, opacity }} className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-[var(--sage-deep)] ring-1 ring-[var(--sage)]/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--sage)]/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--sage)]" />
              </span>
              Now accepting appointments across 5 Bengaluru clinics
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-[var(--ink)] text-balance leading-[1.02]"
            >
              Relieve pain.
              <br />
              <span className="italic font-light text-[var(--sage-deep)]">Restore</span>{" "}
              <span className="relative inline-block">
                movement.
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="10"
                  viewBox="0 0 300 10"
                  fill="none"
                >
                  <path
                    d="M2 7 Q 75 2, 150 6 T 298 5"
                    stroke="var(--bronze)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-6 max-w-xl text-lg text-[var(--ink-soft)] leading-relaxed"
            >
              Professional physiotherapy for pain relief, mobility restoration,
              neurological rehabilitation, sports injuries and long-term wellness —
              delivered by certified physiotherapists.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="#book"
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--sage)] px-6 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-elev)] hover:bg-[var(--sage-deep)] transition-all hover:-translate-y-0.5"
              >
                Book Appointment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#treatments"
                className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-6 py-3.5 text-sm font-semibold text-[var(--ink)] ring-1 ring-black/5 hover:bg-white transition-all"
              >
                Explore Treatments
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-12 grid grid-cols-3 gap-6 max-w-md"
            >
              {[
                ["5", "Clinics"],
                ["1000+", "Patients"],
                ["15+", "Physios"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl font-extrabold text-[var(--ink)]">{n}</div>
                  <div className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mt-1">
                    {l}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] shadow-[var(--shadow-elev)] ring-1 ring-black/5">
              <img
                src={heroImg}
                alt="Physiotherapist guiding a patient through mobility exercise"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--sage-deep)]/40 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ TRUST STRIP ------------------------------ */

function TrustStrip() {
  const items = [
    { icon: MapPin, label: "5 Bengaluru Clinics" },
    { icon: HeartPulse, label: "1000+ Happy Patients" },
    { icon: Stethoscope, label: "Certified Physiotherapists" },
    { icon: ShieldCheck, label: "Evidence-Based Care" },
  ];
  return (
    <section className="border-y border-black/[0.06] bg-white/50 backdrop-blur-sm py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 justify-center md:justify-start">
              <Icon className="h-5 w-5 text-[var(--sage)]" />
              <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ ABOUT ------------------------------ */

function About() {
  return (
    <section id="about" className="py-24 sm:py-32 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden shadow-[var(--shadow-elev)] ring-1 ring-black/5">
              <img src={aboutImg} alt="Physiotherapist working with a patient" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="absolute -bottom-6 -right-4 sm:-right-6 glass rounded-2xl p-5 w-56 shadow-[var(--shadow-elev)]">
              <div className="text-4xl font-extrabold text-[var(--sage-deep)]">
                <Counter to={12} />+
              </div>
              <div className="text-sm text-[var(--ink-soft)] mt-1">Years of hands-on physiotherapy expertise</div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
              About CorpErgo
            </div>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
              Recovery, reimagined for how you live and move.
            </h2>
            <p className="mt-5 text-lg text-[var(--ink-soft)] leading-relaxed">
              CorpErgo is a physiotherapy-first clinic chain built on evidence,
              empathy and outcomes. From posture correction to post-surgery
              rehabilitation, our team designs a plan for your body, your goals
              and your timeline.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
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
                <div key={x.n} className="rounded-2xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)]">
                  <div className="text-xs font-bold text-[var(--bronze)]">{x.n}</div>
                  <div className="mt-1 text-base font-bold text-[var(--ink)]">{x.t}</div>
                  <div className="mt-1 text-sm text-[var(--ink-soft)] leading-relaxed">{x.d}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                [<Counter to={1000} suffix="+" />, "Patients"],
                [<Counter to={5} />, "Clinics"],
                [<Counter to={98} suffix="%" />, "Satisfaction"],
              ].map(([v, l], i) => (
                <div key={i}>
                  <div className="text-3xl font-extrabold text-[var(--sage-deep)]">{v}</div>
                  <div className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mt-1">
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
  { icon: Bone, title: "Orthopaedic Physiotherapy", desc: "Joint, bone & post-fracture rehabilitation." },
  { icon: Brain, title: "Neurological Rehabilitation", desc: "Stroke, Parkinson's and nerve injury recovery." },
  { icon: Dumbbell, title: "Sports Injury Rehab", desc: "Return-to-sport programs for athletes." },
  { icon: Activity, title: "Musculoskeletal Therapy", desc: "Manual therapy for pain & mobility." },
  { icon: HeartPulse, title: "Women's Health", desc: "Pre & post-natal and pelvic floor care." },
  { icon: Baby, title: "Pediatric Physiotherapy", desc: "Gentle developmental support for children." },
  { icon: UserRound, title: "Geriatric Physiotherapy", desc: "Balance, strength & fall prevention." },
  { icon: Stethoscope, title: "Post-Surgery Rehab", desc: "Structured recovery after operations." },
];

function Treatments() {
  return (
    <section id="treatments" className="py-24 sm:py-32 bg-white/60 relative">
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
            Every plan is built around your assessment, your goals and evidence-based
            protocols — not a template.
          </p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TREATMENTS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl bg-[var(--ivory)] p-6 ring-1 ring-black/[0.05] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elev)] transition-all overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--sage)] via-[var(--teal)] to-[var(--bronze)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)] group-hover:bg-[var(--sage)] group-hover:text-white transition-colors">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-5 text-lg font-bold text-[var(--ink)] leading-snug">{title}</div>
              <div className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">{desc}</div>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-[var(--sage-deep)] opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CONDITIONS ------------------------------ */

const CONDITIONS = [
  "Back Pain", "Neck Pain", "Frozen Shoulder", "Sciatica", "Stroke Rehabilitation",
  "ACL Injury", "Tennis Elbow", "Posture Correction", "Balance Disorders", "Joint Pain",
];

function Conditions() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
              Conditions we treat
            </div>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
              If it's holding you back, we can help.
            </h2>
          </div>
          <a href="#book" className="text-sm font-semibold text-[var(--sage-deep)] inline-flex items-center gap-1.5 hover:gap-2 transition-all">
            Not sure? Talk to a physio <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CONDITIONS.map((c, i) => (
            <motion.div
              key={c}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl bg-white p-5 ring-1 ring-black/[0.05] hover:ring-[var(--sage)]/30 hover:shadow-[var(--shadow-soft)] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[var(--sage)] text-xs font-bold">
                <Check className="h-4 w-4" />
                <span className="uppercase tracking-widest">Treatable</span>
              </div>
              <div className="mt-2 font-bold text-[var(--ink)] group-hover:text-[var(--sage-deep)] transition-colors">
                {c}
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
    { t: "Evidence-Based Treatment", d: "Protocols grounded in clinical research and measurable outcomes." },
    { t: "Certified Physiotherapists", d: "Licensed experts with specialization in orthopaedic, neuro & sports." },
    { t: "Modern Equipment", d: "Latest rehabilitation tools for faster, safer recovery." },
    { t: "Individual Care", d: "One-on-one sessions — never a shared or hurried appointment." },
    { t: "5 Bengaluru Clinics", d: "Chansandra, Balagere, Muthsandra, Kannamangala & Manduru." },
    { t: "Affordable Care", d: "Transparent pricing and flexible session packages." },
  ];
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-[var(--ivory)] to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
            Why choose CorpErgo
          </div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
            A different kind of physiotherapy clinic.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((x, i) => (
            <motion.div
              key={x.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group relative rounded-3xl p-8 bg-white ring-1 ring-black/[0.05] hover:ring-[var(--sage)]/20 transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elev)] overflow-hidden"
            >
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[var(--sage)]/8 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative">
                <div className="text-5xl font-extrabold text-[var(--sage)]/25 group-hover:text-[var(--sage)]/40 transition-colors">
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
    color: "from-[#5D725E] to-[#47563F]",
    url: "https://www.instagram.com/reel/DaaqA0HxJ8o/",
  },
  {
    id: "DZnTwpaxLR4",
    title: "Recovery in motion",
    tag: "Reel",
    color: "from-[#6F9E9C] to-[#4E7B7A]",
    url: "https://www.instagram.com/reel/DZnTwpaxLR4/",
  },
  {
    id: "DZEeWgSxZx7",
    title: "Patient journey",
    tag: "Reel",
    color: "from-[#9A7059] to-[#7A5644]",
    url: "https://www.instagram.com/reel/DZEeWgSxZx7/",
  },
  {
    id: "DIdJ8eczP_i",
    title: "Therapy insights",
    tag: "Reel",
    color: "from-[#5D725E] to-[#6F9E9C]",
    url: "https://www.instagram.com/reel/DIdJ8eczP_i/",
  },
  {
    id: "DGTB4tvSuLK",
    title: "Hands-on care",
    tag: "Reel",
    color: "from-[#9A7059] to-[#5D725E]",
    url: "https://www.instagram.com/reel/DGTB4tvSuLK/",
  },
  {
    id: "DRRGSVQEsyy",
    title: "Stronger every day",
    tag: "Reel",
    color: "from-[#47563F] to-[#6F9E9C]",
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
    <section id="videos" className="py-24 bg-[var(--ink)] text-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
              Watch & Learn
            </div>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
              Real recoveries. Real people.
            </h2>
          </div>
          <a
            href={INSTAGRAM_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white"
          >
            <Instagram className="h-4 w-4" /> Follow us
          </a>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
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
              className={`relative shrink-0 snap-start w-[280px] sm:w-[340px] aspect-[3/4] rounded-3xl overflow-hidden group text-left cursor-pointer bg-gradient-to-br ${reel.color}`}
            >
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              <div className="absolute inset-0 grain opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[var(--ink)] shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 fill-current ml-1" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                  <Instagram className="h-3.5 w-3.5" /> {reel.tag}
                </div>
                <div className="mt-1 text-xl font-bold">{reel.title}</div>
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
          <div className="relative z-10 w-full max-w-[420px] aspect-[9/16] max-h-[min(88vh,760px)] rounded-3xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setActiveReel(null)}
              className="absolute top-3 right-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75 transition-colors"
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

const PHYSIOS = [
  { name: "Dr. Aarav Menon", spec: "Orthopaedic & Sports", exp: "10 yrs", clinic: "Balagere", initials: "AM", color: "#5D725E" },
  { name: "Dr. Priya Sharma", spec: "Neurological Rehab", exp: "8 yrs", clinic: "Chansandra", initials: "PS", color: "#6F9E9C" },
  { name: "Dr. Rohan Iyer", spec: "Musculoskeletal", exp: "12 yrs", clinic: "Muthsandra", initials: "RI", color: "#9A7059" },
  { name: "Dr. Ananya Rao", spec: "Women's Health", exp: "7 yrs", clinic: "Kannamangala", initials: "AR", color: "#5D725E" },
];

function Physios() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">Our Team</div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Meet the hands behind your recovery.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PHYSIOS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -8 }}
              className="group rounded-3xl bg-white p-6 ring-1 ring-black/[0.05] hover:shadow-[var(--shadow-elev)] transition-all"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-5" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}CC)` }}>
                <div className="absolute inset-0 flex items-center justify-center text-white text-5xl font-extrabold tracking-tight">
                  {p.initials}
                </div>
                <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--ink)]">
                  {p.exp}
                </div>
              </div>
              <div className="text-base font-bold text-[var(--ink)]">{p.name}</div>
              <div className="text-sm text-[var(--sage-deep)] font-semibold mt-0.5">{p.spec}</div>
              <div className="text-xs text-[var(--ink-soft)] mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {p.clinic} Clinic
              </div>
              <a href="#book" className="mt-5 flex items-center justify-center gap-1.5 rounded-full bg-[var(--ivory)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--sage)] hover:text-white transition-all">
                Book Session <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ TESTIMONIALS ------------------------------ */

const TESTIMONIALS = [
  { name: "Meera K.", role: "Marathon runner", initials: "MK", color: "#5D725E", quote: "After my ACL surgery I thought running was over. Six months at CorpErgo and I finished my half-marathon." },
  { name: "Rahul V.", role: "Software engineer", initials: "RV", color: "#6F9E9C", quote: "Chronic back pain from years of desk work — gone. The posture program was a game-changer." },
  { name: "Sunita P.", role: "Retired teacher", initials: "SP", color: "#9A7059", quote: "The team is kind, patient and precise. My knee mobility is better than it's been in a decade." },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">Testimonials</div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Stories that matter more than metrics.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl p-7 shadow-[var(--shadow-soft)]"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-[var(--bronze)] text-[var(--bronze)]" />
                ))}
              </div>
              <p className="mt-5 text-[var(--ink)] leading-relaxed text-[15px]">
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full text-white font-bold" style={{ background: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--ink)]">{t.name}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CLINICS ------------------------------ */

const CLINICS = [
  { name: "Chansandra", addr: "Chansandra Main Rd, Bengaluru", hours: "Mon–Sat · 8am–8pm" },
  { name: "Balagere", addr: "Balagere Rd, Varthur, Bengaluru", hours: "Mon–Sat · 8am–8pm" },
  { name: "Muthsandra", addr: "Muthsandra, Whitefield, Bengaluru", hours: "Mon–Sat · 8am–8pm" },
  { name: "Kannamangala", addr: "Kannamangala, Bengaluru East", hours: "Mon–Sat · 8am–8pm" },
  { name: "Manduru", addr: "Manduru, Bengaluru", hours: "Mon–Sat · 8am–8pm" },
];

function Clinics() {
  return (
    <section id="clinics" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">Locations</div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance">
            Five clinics. One standard of care.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CLINICS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6 }}
              className="group rounded-3xl bg-white p-6 ring-1 ring-black/[0.05] hover:shadow-[var(--shadow-elev)] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)] group-hover:bg-[var(--sage)] group-hover:text-white transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--bronze)]">
                  Clinic 0{i + 1}
                </span>
              </div>
              <div className="mt-5 text-xl font-bold text-[var(--ink)]">{c.name}</div>
              <div className="mt-1.5 text-sm text-[var(--ink-soft)] leading-relaxed">{c.addr}</div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink-soft)]">
                <Clock className="h-3.5 w-3.5" /> {c.hours}
              </div>
              <div className="mt-5 flex gap-2">
                <a href="#book" className="flex-1 text-center rounded-full bg-[var(--sage)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--sage-deep)] transition-colors">
                  Book
                </a>
                <a href="#" className="rounded-full bg-[var(--ivory)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-white ring-1 ring-black/5">
                  Map
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FOUNDER ------------------------------ */

function Founder() {
  return (
    <section id="founder" className="py-24 sm:py-32 bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="relative"
          >
            <div className="absolute -inset-3 sm:-inset-4 rounded-[32px] bg-gradient-to-br from-[var(--sage)]/15 via-transparent to-[var(--bronze)]/20 -z-10" />
            <div className="overflow-hidden rounded-[28px] shadow-[var(--shadow-elev)] ring-1 ring-black/[0.04]">
              <img
                src={pinkyImg}
                alt="Dr. Pinky Dutta PT, Head of Department at CorpErgo"
                className="aspect-[4/5] w-full object-cover object-[center_18%] sm:object-[center_15%]"
                width={640}
                height={800}
                decoding="async"
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-[280px] rounded-2xl bg-white/95 backdrop-blur-md px-4 py-3 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05]">
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--bronze)]">
                Founder of CorpErgo
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--ink)] leading-snug">
                Leading care across Bengaluru
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--bronze)] font-semibold">
              Leadership
            </div>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--ink)] text-balance leading-[1.08]">
              Care that starts with clinical conviction.
            </h2>

            <div className="relative mt-8 pl-1">
              <Quote
                className="absolute -left-1 -top-1 h-10 w-10 text-[var(--sage)]/20"
                aria-hidden
              />
              <blockquote className="relative text-xl sm:text-2xl font-medium leading-relaxed text-[var(--ink)] text-balance pl-8">
                “Pain is only the beginning of the story. At CorpErgo, we restore
                movement, rebuild confidence, and walk with every patient until
                they feel strong in their own body again.”
              </blockquote>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10">
              <div>
                <div className="text-xl font-extrabold tracking-tight text-[var(--ink)]">
                  Dr. Pinky Dutta PT
                </div>
                <div className="mt-1.5 text-sm font-semibold text-[var(--sage-deep)]">
                  Head of the Department
                </div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">
                  Musculoskeletal &amp; Sports Physiotherapist
                </div>
              </div>
              <div className="hidden sm:block h-14 w-px bg-[var(--ink)]/10" />
              <p className="text-sm text-[var(--ink-soft)] max-w-xs leading-relaxed">
                Owner of CorpErgo’s five Bengaluru clinics — Chansandra, Balagere,
                Muthsandra, Kannamangala &amp; Manduru.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CTA ------------------------------ */

function CTA() {
  return (
    <section id="book" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[36px] p-10 sm:p-16 lg:p-20 grain" style={{ background: "linear-gradient(135deg, #47563F 0%, #5D725E 40%, #6F9E9C 100%)" }}>
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[var(--bronze)]/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="text-xs uppercase tracking-[0.22em] text-white/70 font-semibold">Ready when you are</div>
            <h2 className="mt-4 text-4xl sm:text-6xl font-extrabold tracking-tight text-white text-balance leading-[1.05]">
              Ready to start your recovery journey?
            </h2>
            <p className="mt-5 text-lg text-white/80 max-w-xl">
              Book a first assessment with a certified CorpErgo physiotherapist —
              at the clinic closest to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#" className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[var(--sage-deep)] hover:bg-[var(--ivory)] transition-all hover:-translate-y-0.5 shadow-xl">
                Book Appointment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="tel:+911234567890" className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-all">
                <Phone className="h-4 w-4" /> Call us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FOOTER ------------------------------ */

function Footer() {
  return (
    <footer id="contact" className="bg-[#2E3B33] text-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <img
              src={logoImg}
              alt="CorpErgo"
              className="h-16 w-auto object-contain object-left brightness-110"
              width={64}
              height={64}
              decoding="async"
            />
            <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
              Physiotherapy · Bengaluru
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60 max-w-xs">
              Premium physiotherapy across five Bengaluru clinics. Evidence-based
              care for pain, mobility and long-term wellness.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={INSTAGRAM_PROFILE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                aria-label="CorpErgo on Instagram"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <div className="text-white font-bold text-sm uppercase tracking-widest">Quick Links</div>
            <ul className="mt-5 space-y-3 text-sm">
              {["Treatments", "About", "Clinics", "Testimonials", "Book Appointment"].map((x) => (
                <li key={x}><a href="#" className="hover:text-white transition-colors">{x}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-white font-bold text-sm uppercase tracking-widest">Branches</div>
            <ul className="mt-5 space-y-3 text-sm">
              {CLINICS.map((c) => (
                <li key={c.name} className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[var(--bronze)]" /> {c.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-white font-bold text-sm uppercase tracking-widest">Contact</div>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-[var(--bronze)]" /> +91 12345 67890</li>
              <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 text-[var(--bronze)]" /> care@corpergo.in</li>
              <li className="flex items-start gap-2"><Clock className="h-4 w-4 mt-0.5 text-[var(--bronze)]" /> Mon–Sat · 8am–8pm</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div>© {new Date().getFullYear()} CorpErgo Physiotherapy. All rights reserved.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------ PAGE ------------------------------ */

function LandingPage() {
  return (
    <main className="relative overflow-x-clip bg-[var(--ivory)]">
      <Nav />
      <Hero />
      <TrustStrip />
      <About />
      <Treatments />
      <Conditions />
      <WhyChoose />
      <VideoStories />
      <Physios />
      <Testimonials />
      <Clinics />
      <Founder />
      <CTA />
      <Footer />
    </main>
  );
}
