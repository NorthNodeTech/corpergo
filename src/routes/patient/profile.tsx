import { FormEvent, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  PatientIntakeForm,
  type PatientIntakeValues,
} from "@/components/portal/PatientIntakeForm";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { fetchMyProfile } from "@/lib/auth";
import { fetchMyPatient, updateMyPatient, updateMyProfile } from "@/lib/clinic-data";
import { emptyMedicalConditions, normalizePatient } from "@/lib/patient-intake";

export const Route = createFileRoute("/patient/profile")({
  component: PatientProfilePage,
});

function PatientProfilePage() {
  const [values, setValues] = useState<PatientIntakeValues | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([fetchMyProfile(), fetchMyPatient()]).then(([p, pat]) => {
      const profile = p.data;
      const raw = pat.data?.[0];
      if (!profile || !raw) return;
      const patient = normalizePatient({
        ...raw,
        medical_conditions: raw.medical_conditions || emptyMedicalConditions(),
      });
      setValues({
        full_name: profile.full_name,
        phone: profile.phone || "",
        email: profile.email || "",
        patient,
      });
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!values) return;
    setSaving(true);
    const [a, b] = await Promise.all([
      updateMyProfile({ full_name: values.full_name, phone: values.phone || null }),
      updateMyPatient(values.patient.id, values.patient),
    ]);
    setSaving(false);
    if (a.error || b.error) toast.error(a.error || b.error || "Save failed");
    else toast.success("Health profile saved");
  }

  if (!values) {
    return <div className="text-[var(--ink-soft)]">Loading profile…</div>;
  }

  return (
    <div>
      <PortalPageHeader
        eyebrow="Registration"
        title="Health profile"
        description="Fill this once before your first visit. Update only when something changes — your physiotherapist reviews this after QR check-in."
      />

      <form
        onSubmit={onSubmit}
        className="max-w-3xl space-y-6 rounded-[2rem] bg-white p-6 sm:p-8 ring-1 ring-black/[0.05]"
      >
        <PatientIntakeForm values={values} onChange={setValues} />

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--sage)] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save health profile"}
        </button>
      </form>
    </div>
  );
}
