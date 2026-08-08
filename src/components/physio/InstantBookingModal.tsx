import { useNavigate } from "@tanstack/react-router";
import { PhoneCall, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  defaultDirectBookingCategory,
  type DirectBookingGender,
} from "@/lib/direct-booking-data";
import {
  createInstantPatientSession,
  defaultInstantBookingEmail,
  defaultInstantBookingPassword,
} from "@/lib/instant-booking-data";
import { fetchCategories, type Category } from "@/lib/clinic-data";
import { resolveStaffClinicId } from "@/lib/physio-data";

const fieldClass =
  "mt-1.5 w-full rounded-2xl bg-[var(--ivory)] px-4 py-3 text-sm ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-[var(--saffron)]/40";

function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

type InstantBookingModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function InstantBookingModal({ open, onClose, onCreated }: InstantBookingModalProps) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<DirectBookingGender>("male");
  const [ageYears, setAgeYears] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState(todayIsoDate());
  const [sessionTime, setSessionTime] = useState(currentTimeValue());

  useEffect(() => {
    if (!open) return;
    void Promise.all([fetchCategories(), resolveStaffClinicId()]).then(([categoryRes, id]) => {
      const list = categoryRes.data || [];
      setCategories(list);
      setCategoryId((current) => current || defaultDirectBookingCategory(list));
      setClinicId(id);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (phone.trim() && fullName.trim()) {
      setEmail((current) =>
        current ? current : defaultInstantBookingEmail(fullName, phone),
      );
      setPassword((current) =>
        current ? current : defaultInstantBookingPassword(phone),
      );
    }
  }, [open, fullName, phone]);

  if (!open) return null;

  async function handleSubmit() {
    const age = Number(ageYears);
    if (!fullName.trim()) {
      toast.error("Enter the patient name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Enter the patient phone number.");
      return;
    }
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      toast.error("Enter a valid age.");
      return;
    }

    setBusy(true);
    const { data, error } = await createInstantPatientSession({
      fullName,
      phone,
      gender,
      ageYears: age,
      email,
      password,
      categoryId,
      scheduledDate: sessionDate,
      scheduledTime: sessionTime,
      clinicId: clinicId || undefined,
    });
    setBusy(false);

    if (error || !data) {
      toast.error(error || "Could not create instant booking.");
      return;
    }

    toast.success("Walk-in patient created — opening assessment");
    onClose();
    window.dispatchEvent(new CustomEvent("physio-workspace-refresh"));
    onCreated?.();
    void navigate({
      to: "/physio/assessments/$appointmentId",
      params: { appointmentId: data.appointment_id },
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--saffron-light)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--saffron-deep)]">
              <PhoneCall className="h-3.5 w-3.5" />
              Instant booking
            </div>
            <h3 className="mt-3 text-xl font-extrabold text-[var(--ink)]">
              Phone walk-in patient
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Create an account and start the session when someone calls the clinic for an
              appointment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--ink-soft)] hover:bg-black/5"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-[var(--ivory)] px-4 py-3 text-xs text-[var(--ink-soft)] ring-1 ring-black/5">
          The patient is checked in immediately. Share the login credentials after you save the
          assessment.
        </div>

        <div className="mt-5 grid gap-4">
          <label className="block text-sm font-semibold">
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={fieldClass}
              placeholder="Patient name"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                placeholder="+91..."
              />
            </label>
            <label className="block text-sm font-semibold">
              Age
              <input
                type="number"
                min={0}
                max={120}
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Gender
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as DirectBookingGender)}
              className={fieldClass}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Email / login id
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Temporary password
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Category
            <select
              value={categoryId || ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className={fieldClass}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Session date
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-semibold">
              Session time
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--ink-soft)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {busy ? "Creating..." : "Create & start assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}
