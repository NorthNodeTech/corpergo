import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ClipboardCheck, Hand, UserRound, Workflow } from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import {
  INDUSTRIAL_MACHINES,
  type IndustrialMachine,
} from "@/features/landing/industrial-machines";

export function IndustrialMachinePage({ machine }: { machine: IndustrialMachine }) {
  const others = INDUSTRIAL_MACHINES.filter((item) => item.id !== machine.id);

  const guides = [
    { icon: Hand, title: "Correct usage", body: machine.usage },
    { icon: UserRound, title: "Correct posture while operating", body: machine.posture },
    { icon: Workflow, title: "Ergonomic working methods", body: machine.method },
  ];

  return (
    <main className="min-h-dvh bg-[#f7f6f3] text-[var(--ink)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Link
          to="/"
          hash="industrial-ergonomics"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] ring-1 ring-black/[0.06] transition hover:bg-[var(--saffron)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>
        <Link to="/" aria-label="CorpErgo home">
          <CorpErgoLogo size="sm" withFrame={false} className="h-10 w-auto" />
        </Link>
      </header>

      <article className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--saffron-deep)]">
          Industrial Ergonomics
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          {machine.name}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
          {machine.role}
        </p>

        <figure className="mt-8">
          <img
            src={machine.image}
            alt={machine.name}
            className="mx-auto max-h-[min(68vh,34rem)] w-auto max-w-full rounded-[28px] object-contain"
            width={1200}
            height={1200}
            decoding="async"
          />
          <figcaption className="mt-3 text-center text-xs font-semibold tracking-wide text-[var(--ink-soft)]">
            {machine.shortName}
          </figcaption>
        </figure>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:gap-16">
          <div className="space-y-10">
            {guides.map(({ icon: Icon, title, body }) => (
              <section key={title}>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ink)] text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                </div>
                <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  {body}
                </p>
              </section>
            ))}
          </div>

          <aside className="lg:border-l lg:border-black/[0.08] lg:pl-10">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--saffron)] text-white">
                <ClipboardCheck className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">Body-position check</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {machine.assessment.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--ink-soft)]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--saffron)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-l-[3px] border-[var(--saffron)] pl-4 text-sm font-medium leading-relaxed text-[var(--ink)]">
              {machine.recommendation}
            </p>
            <p className="mt-6 text-xs leading-relaxed text-[var(--ink-soft)]">
              Clinical parameters, stimulation settings, traction force, range of motion and
              treatment duration are set only by a qualified physiotherapist, according to the
              patient&apos;s condition, clinic protocol and the manufacturer&apos;s instructions.
            </p>
          </aside>
        </div>

        {others.length > 0 ? (
          <nav className="mt-14 border-t border-black/[0.08] pt-6" aria-label="Other machines">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
              Also in this guide
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {others.map((item) => (
                <li key={item.id}>
                  <Link
                    to="/industrial-ergonomics/$machineId"
                    params={{ machineId: item.id }}
                    className="text-sm font-bold text-[var(--ink)] underline-offset-4 transition hover:text-[var(--saffron-deep)] hover:underline"
                  >
                    {item.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </article>
    </main>
  );
}
