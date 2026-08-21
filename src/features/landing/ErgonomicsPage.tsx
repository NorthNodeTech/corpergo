import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Factory, Monitor, ShieldCheck } from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import { PhoneAppIcon, WhatsAppIcon } from "@/shared/components/icons/BrandIcons";
import ergonomicsIndustrialImg from "@/assets/ergonomics/ergonomics-industrial-coaching.webp";
import ergonomicsSafeOpImg from "@/assets/ergonomics/ergonomics-safe-operation.webp";
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_ALT_DISPLAY,
  WHATSAPP_CONSULT_URL,
} from "@/lib/seo";

const FOCUS_POINTS = [
  "Correct machine and equipment use",
  "Safe operator posture on the floor",
  "Ergonomic working methods for repetitive tasks",
  "Body-position checks that prevent strain injuries",
  "Workstation and workplace assessments",
  "Training sessions for teams and supervisors",
] as const;

const SERVICES = [
  {
    icon: Factory,
    title: "Industrial ergonomics",
    desc: "On-site coaching for safe machine operation, reach, and posture so workers avoid injury on the shop floor.",
  },
  {
    icon: Monitor,
    title: "Corporate ergonomics",
    desc: "Office workstation checks, posture correction, and wellness sessions for desk-based teams.",
  },
  {
    icon: ShieldCheck,
    title: "Injury prevention",
    desc: "Practical methods that reduce strain, fatigue, and work-related musculoskeletal disorders.",
  },
] as const;

export function ErgonomicsPage() {
  return (
    <main className="mobile-compact-page min-h-dvh bg-[var(--ivory)] text-[var(--ink)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-[var(--ink-soft)] ring-1 ring-black/5 transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <CorpErgoLogo size="sm" withFrame={false} />
        </div>

        <section className="mt-5 grid items-center gap-6 lg:mt-12 lg:grid-cols-2 lg:gap-14">
          <div className="relative grid grid-cols-[1.15fr_0.85fr] gap-2.5 sm:gap-4">
            <div className="overflow-hidden rounded-[22px] shadow-[var(--shadow-elev)] ring-1 ring-black/5 sm:rounded-[28px]">
              <img
                src={ergonomicsIndustrialImg}
                alt="CorpErgo ergonomist coaching a factory operator on safe machine posture"
                className="h-full min-h-[14rem] w-full object-cover sm:min-h-[28rem]"
                width={900}
                height={1200}
                decoding="async"
              />
            </div>
            <div className="flex flex-col gap-2.5 sm:gap-4">
              <div className="overflow-hidden rounded-[22px] shadow-[var(--shadow-soft)] ring-1 ring-black/5 sm:rounded-[28px]">
                <img
                  src={ergonomicsSafeOpImg}
                  alt="Hands-on industrial ergonomics training for safe equipment operation"
                  className="aspect-[3/4] h-full w-full object-cover"
                  width={720}
                  height={960}
                  decoding="async"
                />
              </div>
              <div className="rounded-[20px] bg-[var(--ink)] px-3.5 py-3 text-white sm:rounded-[24px] sm:px-5 sm:py-5">
                <div className="text-xl font-extrabold tracking-tight text-[var(--saffron)] sm:text-2xl">
                  Safe use
                </div>
                <p className="mt-1 text-xs leading-snug text-white/75 sm:text-sm">
                  Teach workers how to operate tools and machines without injury.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="type-eyebrow text-[var(--bronze)]">Ergonomics</div>
            <h1 className="type-h1 mt-2 font-extrabold tracking-tight text-balance">
              Design work so people stay safe and efficient.
            </h1>
            <p className="type-lead mt-3 text-[var(--ink-soft)]">
              Ergonomics is the science of arranging tools, machines, and tasks so the body works
              safely — less strain, fewer injuries, better output at work.
            </p>

            <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
              <div>
                <h2 className="text-base font-bold text-[var(--ink)]">What is ergonomics?</h2>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--ink-soft)] sm:mt-1.5 sm:text-[0.9375rem]">
                  It studies how people interact with equipment and workspaces, then reshapes that
                  setup so movement stays natural and fatigue stays low.
                </p>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--ink)]">Who is an ergonomist?</h2>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--ink-soft)] sm:mt-1.5 sm:text-[0.9375rem]">
                  An ergonomist assesses posture, reach, and machine use, then trains teams on safer
                  methods — so industrial and office work does not create chronic pain or injury.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-2.5">
              {FOCUS_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-[0.875rem] text-[var(--ink-soft)] sm:text-[0.9375rem]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--saffron)]" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 sm:mt-16">
          <div className="max-w-2xl">
            <div className="type-eyebrow text-[var(--bronze)]">What we offer</div>
            <h2 className="type-h2 mt-2 font-extrabold tracking-tight text-balance">
              Practical ergonomics for industry and offices.
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 sm:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-6"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--saffron-light)] text-[var(--saffron-deep)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 mb-4 rounded-[22px] bg-[var(--ink)] px-4 py-5 text-white sm:mt-16 sm:mb-6 sm:rounded-[28px] sm:px-10 sm:py-10">
          <div className="max-w-2xl">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-3xl">
              Need an ergonomics session or consultation?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75 sm:mt-3 sm:text-[15px]">
              Call or WhatsApp CorpErgo — we help teams use equipment safely and reduce workplace
              injury risk.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-2.5">
              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--saffron)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--saffron-deep)] sm:w-fit"
              >
                <PhoneAppIcon className="h-4 w-4 shrink-0" />
                {SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                href={WHATSAPP_CONSULT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 sm:w-fit"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {SUPPORT_PHONE_ALT_DISPLAY}
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
