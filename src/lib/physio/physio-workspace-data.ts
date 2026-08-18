import { fetchMyProfile } from "@/lib/auth";
import { formatClinicName } from "@/lib/core/utils";
import { fetchClinics, matchesClinicId as matchesClinicIdPatient } from "@/lib/patient/clinic-data";
import {
  fetchDirectBookingRequests,
  filterActiveDirectRequests,
  instantWalkInAppointments,
  type DirectBookingRequest,
} from "@/lib/booking/direct-booking-data";
import {
  ageFromPatient,
  fetchClinicAppointments,
  resolveStaffClinicId,
  type PhysioAppointment,
} from "@/lib/physio/physio-data";

export type PhysioInsight = {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "good" | "warn";
};

export type CategoryCount = {
  name: string;
  count: number;
};

export type PhysioWorkspaceBundle = {
  profileName: string;
  clinicName: string;
  todayQueue: PhysioAppointment[];
  pending: PhysioAppointment[];
  directRequests: DirectBookingRequest[];
  directRequestsActive: DirectBookingRequest[];
  instantWalkIns: PhysioAppointment[];
  cancelled: PhysioAppointment[];
  accepted: PhysioAppointment[];
  completedToday: PhysioAppointment[];
  assessable: PhysioAppointment[];
  assessedAppointmentIds: string[];
  directAppointmentIds: string[];
  instantAppointmentIds: string[];
  inProgressQueue: PhysioAppointment[];
  current: PhysioAppointment | null;
  insights: PhysioInsight[];
  categories: CategoryCount[];
  counts: {
    today: number;
    waiting: number;
    pending: number;
    direct: number;
    followUps: number;
    completed: number;
  };
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function apptTime(a: PhysioAppointment) {
  return (a.scheduled_time || a.preferred_time || "").slice(0, 5) || "—";
}

function buildInsights(
  queue: PhysioAppointment[],
  pending: PhysioAppointment[],
  directRequests: DirectBookingRequest[],
  assessable: PhysioAppointment[],
  assessedIds: Set<string>,
): PhysioInsight[] {
  const items: PhysioInsight[] = [];
  const waiting = queue.filter((a) => a.status === "checked_in");
  if (waiting.length) {
    items.push({
      id: "waiting",
      tone: waiting.length > 2 ? "warn" : "info",
      title: `${waiting.length} patient${waiting.length > 1 ? "s" : ""} waiting now`,
      detail: waiting
        .slice(0, 3)
        .map((a) => a.patients?.profiles?.full_name || "Patient")
        .join(", "),
    });
  } else {
    items.push({
      id: "clear",
      tone: "good",
      title: "No one is waiting",
      detail: "You're clear until the next check-in. Enjoy the pause.",
    });
  }

  if (pending.length) {
    items.push({
      id: "pending",
      tone: "warn",
      title: `${pending.length} booking request${pending.length > 1 ? "s" : ""} need action`,
      detail: "Accept, reject, or reschedule from Requests.",
    });
  }

  if (directRequests.length) {
    items.push({
      id: "direct",
      tone: "warn",
      title: `${directRequests.length} direct booking request${directRequests.length > 1 ? "s" : ""} waiting`,
      detail: directRequests
        .slice(0, 3)
        .map((request) => request.full_name)
        .join(", "),
    });
  }

  const needsAssess = assessable.filter(
    (a) =>
      (a.status === "checked_in" || a.status === "accepted") &&
      !assessedIds.has(a.id),
  );
  if (needsAssess.length) {
    items.push({
      id: "assess",
      tone: "info",
      title: `${needsAssess.length} visit${needsAssess.length > 1 ? "s" : ""} ready for assessment`,
      detail: "Open Assessments to complete clinical notes.",
    });
  }

  const symptoms = queue.map((a) => (a.symptoms || "").toLowerCase()).filter(Boolean);
  const back = symptoms.filter((s) => /back|spine|lumbar|disc/.test(s)).length;
  if (back >= 2) {
    items.push({
      id: "back-pain",
      tone: "info",
      title: `${back} lower-back cases on today's list`,
      detail: "Consider grouping similar treatments for flow.",
    });
  }

  const byHour = new Map<string, number>();
  for (const a of queue) {
    const h = apptTime(a).slice(0, 2);
    if (h && h !== "—") byHour.set(h, (byHour.get(h) || 0) + 1);
  }
  let peak = "";
  let peakN = 0;
  for (const [h, n] of byHour) {
    if (n > peakN) {
      peak = h;
      peakN = n;
    }
  }
  if (peak) {
    items.push({
      id: "peak",
      tone: "info",
      title: `Busiest slot around ${peak}:00`,
      detail: `${peakN} appointments clustered near that hour.`,
    });
  }

  return items.slice(0, 5);
}

function buildCategories(appts: PhysioAppointment[]): CategoryCount[] {
  const map = new Map<string, number>();
  for (const a of appts) {
    const name = a.physiotherapy_categories?.name || "General";
    map.set(name, (map.get(name) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function pickCurrentPatient(
  queue: PhysioAppointment[],
  assessedIds: Set<string>,
): PhysioAppointment | null {
  const active = queue.filter(
    (a) =>
      (a.status === "checked_in" || a.status === "accepted") && !assessedIds.has(a.id),
  );
  const waiting = active.filter((a) => a.status === "checked_in");
  if (waiting[0]) return waiting[0];
  return active.find((a) => a.status === "accepted") || null;
}

export function patientAge(a: PhysioAppointment) {
  return ageFromPatient(a.patients);
}

export function patientName(a: PhysioAppointment) {
  return a.patients?.profiles?.full_name?.trim() || "Patient";
}

export function visitTimeLabel(a: PhysioAppointment) {
  return apptTime(a);
}

export async function fetchPhysioWorkspace(): Promise<PhysioWorkspaceBundle> {
  const today = todayIso();
  const [profileRes, clinicId] = await Promise.all([
    fetchMyProfile(),
    resolveStaffClinicId(),
  ]);

  if (!clinicId) {
    return {
      profileName: profileRes.data?.full_name?.trim() || "Doctor",
      clinicName: "CorpErgo Clinic",
      todayQueue: [],
      pending: [],
      directRequests: [],
      directRequestsActive: [],
      instantWalkIns: [],
      cancelled: [],
      accepted: [],
      completedToday: [],
      assessable: [],
      assessedAppointmentIds: [],
      directAppointmentIds: [],
      instantAppointmentIds: [],
      inProgressQueue: [],
      current: null,
      insights: [],
      categories: [],
      counts: { today: 0, waiting: 0, pending: 0, direct: 0, followUps: 0, completed: 0 },
    };
  }

  // Fetch all appointments for this clinic and direct booking requests in parallel
  const [allRes, directRes] = await Promise.all([
    fetchClinicAppointments(undefined, clinicId),
    fetchDirectBookingRequests(),
  ]);

  const all = allRes.data || [];
  const allDirect = (directRes.data || []).filter(
    (request) => !request.clinic_id || matchesClinicIdPatient(clinicId, request.clinic_id),
  );

  const assessedAppointmentIds = all
    .filter((a) => Boolean(a.assessments && a.assessments.length > 0))
    .map((a) => a.id);
  const assessedIds = new Set(assessedAppointmentIds);

  const pending = all.filter((a) => a.status === "pending");
  const cancelled = all.filter((a) => a.status === "cancelled");
  const queue = all
    .filter((a) => {
      const visitDate = a.scheduled_date || a.preferred_date;
      return (
        visitDate === today &&
        (a.status === "accepted" || a.status === "checked_in" || a.status === "completed")
      );
    })
    .sort((a, b) => {
      const timeA = (a.scheduled_time || a.preferred_time || "").slice(0, 5);
      const timeB = (b.scheduled_time || b.preferred_time || "").slice(0, 5);
      return timeA.localeCompare(timeB);
    });

  const assessable = all.filter(
    (a) =>
      (a.status === "checked_in" || a.status === "completed" || a.status === "accepted") &&
      !assessedIds.has(a.id),
  );

  const todayAll = all.filter((a) => (a.scheduled_date || a.preferred_date) === today);

  const directApptIds = allDirect
    .map((request) => request.appointment_id)
    .filter((id): id is string => Boolean(id));

  const directRequests = filterActiveDirectRequests(allDirect);
  const directRequestsActive = directRequests;
  const instantWalkIns = instantWalkInAppointments(allDirect, all, assessedIds);
  const directAppointmentIds = [
    ...new Set(
      directApptIds.filter((id) => {
        const req = allDirect.find((r) => r.appointment_id === id);
        return (req?.booking_source || "web") === "web";
      }),
    ),
  ];
  const instantAppointmentIds = [
    ...new Set(
      allDirect
        .filter((r) => r.booking_source === "instant" && r.appointment_id)
        .map((r) => r.appointment_id!),
    ),
  ];

  const inProgressQueue = queue.filter((a) => !assessedIds.has(a.id) && a.status !== "completed");

  let clinicName =
    all[0]?.clinics?.name ||
    directRequests[0]?.clinics?.name ||
    "CorpErgo Clinic";

  if (clinicName === "CorpErgo Clinic" && clinicId) {
    const clinicsRes = await fetchClinics();
    const match = clinicsRes.data?.find((c) => c.id === clinicId);
    if (match) clinicName = match.name;
  }

  const completedById = new Map<string, PhysioAppointment>();
  for (const appt of all) {
    if (appt.status === "completed" || assessedIds.has(appt.id)) {
      const visitDate = appt.scheduled_date || appt.preferred_date;
      const isTodayVisit = visitDate === today || queue.some((q) => q.id === appt.id);
      if (isTodayVisit) completedById.set(appt.id, appt);
    }
  }
  const completedToday = [...completedById.values()].sort((a, b) =>
    apptTime(a).localeCompare(apptTime(b)),
  );
  const accepted = queue.filter((a) => a.status === "accepted");
  const waiting = queue.filter((a) => a.status === "checked_in");

  const followUps = accepted.length;

  return {
    profileName: profileRes.data?.full_name?.trim() || "Doctor",
    clinicName: formatClinicName(clinicName),
    todayQueue: queue,
    pending,
    directRequests,
    directRequestsActive,
    instantWalkIns,
    cancelled: cancelled.slice(0, 10),
    accepted,
    completedToday,
    assessable: assessable.slice(0, 8),
    assessedAppointmentIds,
    directAppointmentIds,
    instantAppointmentIds,
    inProgressQueue,
    current: pickCurrentPatient(queue, assessedIds),
    insights: buildInsights(queue, pending, directRequestsActive, assessable, assessedIds),
    categories: buildCategories(todayAll.length ? todayAll : queue),
    counts: {
      today: todayAll.length || queue.length,
      waiting: waiting.length,
      pending: pending.length,
      direct: directRequestsActive.length + instantWalkIns.length,
      followUps,
      completed: completedToday.length,
    },
  };
}

export { todayIso };
