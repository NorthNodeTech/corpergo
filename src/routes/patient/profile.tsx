import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import type { PatientIntakeValues } from "@/components/portal/PatientIntakeForm";
import { PremiumPatientProfile } from "@/components/portal/premium-profile/PremiumPatientProfile";
import { fetchMyProfile } from "@/lib/auth";
import {
  fetchMyAppointments,
  fetchMyPatient,
  updateMyPatient,
  updateMyProfile,
  type Appointment,
} from "@/lib/clinic-data";
import { emptyMedicalConditions, normalizePatient } from "@/lib/patient-intake";

export const Route = createFileRoute("/patient/profile")({
  component: PatientProfilePage,
});

function PatientProfilePage() {
  const [values, setValues] = useState<PatientIntakeValues | null>(null);
  const snapshot = useRef<PatientIntakeValues | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    void Promise.all([fetchMyProfile(), fetchMyPatient(), fetchMyAppointments()]).then(
      ([p, pat, appts]) => {
        const profile = p.data;
        const raw = pat.data?.[0];
        if (!profile || !raw) return;
        const patient = normalizePatient({
          ...raw,
          medical_conditions: raw.medical_conditions || emptyMedicalConditions(),
        });
        const next: PatientIntakeValues = {
          full_name: profile.full_name,
          phone: profile.phone || "",
          email: profile.email || "",
          avatar_url: profile.avatar_url || null,
          patient,
        };
        snapshot.current = structuredClone(next);
        setValues(next);
        setAppointments(appts.data || []);
        setDirty(false);
      },
    );
  }, []);

  const onChange = useCallback((next: PatientIntakeValues) => {
    setValues(next);
    setDirty(true);
    setSavedFlash(false);
  }, []);

  const onDiscard = useCallback(() => {
    if (!snapshot.current) return;
    setValues(structuredClone(snapshot.current));
    setDirty(false);
    setSavedFlash(false);
    toast.message("Changes discarded");
  }, []);

  const onSave = useCallback(async () => {
    if (!values) return;
    setSaving(true);
    const [a, b] = await Promise.all([
      updateMyProfile({ 
        full_name: values.full_name, 
        phone: values.phone || null,
        avatar_url: values.avatar_url || null
      }),
      updateMyPatient(values.patient.id, values.patient),
    ]);
    setSaving(false);
    if (a.error || b.error) {
      toast.error(a.error || b.error || "Save failed");
      return;
    }
    snapshot.current = structuredClone(values);
    setDirty(false);
    setSavedFlash(true);
    toast.success("Health profile saved");
    window.setTimeout(() => setSavedFlash(false), 2500);
  }, [values]);

  if (!values) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--ink-soft)]">
        Loading your health record…
      </div>
    );
  }

  return (
    <PremiumPatientProfile
      values={values}
      onChange={onChange}
      appointments={appointments}
      saving={saving}
      dirty={dirty}
      onSave={onSave}
      onDiscard={onDiscard}
      savedFlash={savedFlash}
    />
  );
}
