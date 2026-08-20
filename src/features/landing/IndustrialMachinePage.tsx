import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import type { IndustrialMachine } from "@/features/landing/industrial-machines";

export function IndustrialMachinePage({ machine }: { machine: IndustrialMachine }) {
  return (
    <main className="min-h-dvh bg-[#f7f6f3] px-4 py-6 text-[var(--ink)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            hash="industrial-ergonomics"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] transition hover:bg-[var(--saffron)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to homepage
          </Link>
          <Link to="/" aria-label="CorpErgo home">
            <CorpErgoLogo size="sm" withFrame={false} className="h-10 w-auto" />
          </Link>
        </div>

        <article className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-elev)]">
          <div className="bg-[#f3efe8] px-5 py-5 sm:px-8 sm:py-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--saffron-deep)]">
              Industrial Ergonomics
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--ink)] text-balance sm:text-3xl">
              {machine.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)] sm:text-base">
              {machine.role}
            </p>
          </div>

          <div className="px-5 pb-2 sm:px-8">
            <div className="overflow-hidden rounded-2xl bg-[#ece8e1]">
              <img
                src={machine.image}
                alt={machine.name}
                className="mx-auto max-h-[28rem] w-full object-contain p-4 sm:max-h-[32rem] sm:p-6"
                width={900}
                height={1200}
                decoding="async"
              />
            </div>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-8 sm:pb-8">
            <section>
              <h2 className="text-base font-bold text-[var(--ink)]">Correct usage</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{machine.usage}</p>
            </section>
            <section>
              <h2 className="text-base font-bold text-[var(--ink)]">
                Correct posture while operating
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                {machine.posture}
              </p>
            </section>
            <section>
              <h2 className="text-base font-bold text-[var(--ink)]">Ergonomic working methods</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                {machine.method}
              </p>
            </section>
            <section>
              <h2 className="text-base font-bold text-[var(--ink)]">
                Workplace / body-position assessment
              </h2>
              <ul className="mt-3 space-y-2">
                {machine.assessment.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--saffron)]" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <blockquote className="rounded-2xl bg-[var(--saffron-light)] px-4 py-3 text-sm font-medium leading-relaxed text-[var(--ink)]">
              {machine.recommendation}
            </blockquote>
            <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
              Clinical parameters, stimulation settings, traction force, range of motion and
              treatment duration are set only by a qualified physiotherapist, according to the
              patient&apos;s condition, clinic protocol and the manufacturer&apos;s instructions.
            </p>
          </div>
        </article>

        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            hash="industrial-ergonomics"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--saffron)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
