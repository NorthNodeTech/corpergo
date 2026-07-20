import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Shield } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { clearSession } from "@/lib/auth";

export const Route = createFileRoute("/patient/settings")({
  component: PatientSettingsPage,
});

function PatientSettingsPage() {
  function signOut() {
    clearSession();
    window.location.href = "/login";
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Simple account controls. Accessibility-friendly defaults are already applied across the patient portal."
      />

      <div className="max-w-xl space-y-4">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.05]">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage-deep)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-[var(--ink)]">Privacy & security</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)] leading-relaxed">
                Your medical information is protected with role-based access. Only you and your
                clinic care team can view your records.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-black/[0.05]">
          <h2 className="font-extrabold text-[var(--ink)]">Session</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Sign out on shared devices when you finish.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-5 py-3 text-sm font-bold text-rose-800"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
