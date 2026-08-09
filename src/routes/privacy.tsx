import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import { privateRouteHead, SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () =>
    privateRouteHead(
      "/privacy",
      "Privacy Policy - CorpErgo Physiotherapy",
      "Privacy information for CorpErgo physiotherapy appointment and patient portal users.",
    ),
});

function PrivacyPage() {
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
          <p className="type-eyebrow mt-6 font-black text-[var(--bronze)]">Privacy</p>
          <h1 className="type-h1 mt-3 font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="type-body mt-4 text-[var(--ink-soft)]">
            CorpErgo uses patient and appointment information to schedule care, communicate about
            visits, maintain clinical records, and improve clinic operations. We collect only the
            details needed to provide physiotherapy services and protect patient safety.
          </p>

          <section className="mt-8 space-y-3">
            <h2 className="type-h3 font-extrabold">Information we collect</h2>
            <p className="type-body-sm text-[var(--ink-soft)]">
              This can include name, phone number, email, age, gender, appointment preferences,
              symptoms, medical history, clinical notes, prescriptions and rehabilitation progress.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="type-h3 font-extrabold">How we use it</h2>
            <p className="type-body-sm text-[var(--ink-soft)]">
              We use this information for appointment confirmation, patient check-in, assessment,
              treatment planning, follow-up scheduling, reports and support.
            </p>
          </section>

          <section className="mt-6 space-y-3">
            <h2 className="type-h3 font-extrabold">Contact</h2>
            <p className="type-body-sm text-[var(--ink-soft)]">
              For privacy questions, contact CorpErgo at {SUPPORT_EMAIL} or {SUPPORT_PHONE_DISPLAY}.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
