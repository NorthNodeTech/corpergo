import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import { privateRouteHead, SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () =>
    privateRouteHead(
      "/terms",
      "Terms of Use - CorpErgo Physiotherapy",
      "Terms of use for CorpErgo physiotherapy appointment booking and patient portal services.",
    ),
});

function TermsPage() {
  return (
    <main className="min-h-dvh bg-[var(--ivory)] px-4 py-6 text-[var(--ink)] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--ink-soft)] ring-1 ring-black/5 transition-colors hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <article className="mt-6 rounded-3xl bg-white p-6 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-8">
          <CorpErgoLogo size="md" />
          <p className="type-eyebrow mt-6 font-black text-[var(--bronze)]">Terms</p>
          <h1 className="type-h1 mt-3 font-extrabold tracking-tight">Terms of Use</h1>
          <p className="type-body mt-4 text-[var(--ink-soft)]">
            CorpErgo provides physiotherapy appointment booking, clinic check-in and patient portal
            tools to support in-person care. Online booking requests are not confirmed until clinic
            staff accepts or contacts the patient.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="type-h3 font-extrabold">Appointments</h2>
            <p className="type-body-sm text-[var(--ink-soft)]">
              Appointment availability can change. CorpErgo may reschedule, reject or request more
              information when needed for safe clinical care.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="type-h3 font-extrabold">Medical information</h2>
            <p className="type-body-sm text-[var(--ink-soft)]">
              Website content and booking tools do not replace an in-person physiotherapy
              assessment, medical diagnosis or emergency care.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="type-h3 font-extrabold">Contact</h2>
            <p className="type-body-sm text-[var(--ink-soft)]">
              For questions about bookings or these terms, contact CorpErgo at {SUPPORT_EMAIL} or{" "}
              {SUPPORT_PHONE_DISPLAY}.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
