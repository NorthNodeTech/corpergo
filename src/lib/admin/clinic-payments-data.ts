import { getStoredSession, supabaseRest } from "@/lib/auth";

export type PaymentMethod = "UPI" | "Cash" | "Card" | "Other";

export type ClinicPaymentRow = {
  id: string;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  payment_date: string;
  payment_time: string | null;
  recorded_by: string | null;
  created_at: string;
  clinics?: { name: string } | null;
};

export type CreateClinicPaymentInput = {
  clinicId: string;
  patientName: string;
  patientPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  paymentDate: string;
  paymentTime?: string;
};

const PAYMENT_SELECT =
  "id,clinic_id,patient_name,patient_phone,amount,payment_method,notes,payment_date,payment_time,recorded_by,created_at,clinics(name)";

function mapPaymentRow(row: ClinicPaymentRow): ClinicPaymentRow {
  return {
    ...row,
    amount: Number(row.amount),
  };
}

export async function fetchClinicPayments(clinicId: string) {
  const { data, error } = await supabaseRest<ClinicPaymentRow[]>(
    `clinic_payments?clinic_id=eq.${clinicId}&deleted_at=is.null&select=${PAYMENT_SELECT}&order=payment_date.desc,created_at.desc&limit=500`,
  );
  return {
    data: (data || []).map(mapPaymentRow),
    error,
  };
}

export async function fetchNetworkPaymentsForDate(paymentDate: string) {
  const { data, error } = await supabaseRest<ClinicPaymentRow[]>(
    `clinic_payments?payment_date=eq.${paymentDate}&deleted_at=is.null&select=${PAYMENT_SELECT}&order=clinic_id.asc,created_at.desc&limit=1000`,
  );
  return {
    data: (data || []).map(mapPaymentRow),
    error,
  };
}

export async function createClinicPayment(input: CreateClinicPaymentInput) {
  const session = getStoredSession();
  const body = {
    clinic_id: input.clinicId,
    patient_name: input.patientName.trim(),
    patient_phone: input.patientPhone.trim(),
    amount: input.amount,
    payment_method: input.paymentMethod,
    notes: input.notes?.trim() || null,
    payment_date: input.paymentDate,
    payment_time: input.paymentTime || null,
    recorded_by: session?.user?.id || null,
  };

  const { data, error } = await supabaseRest<ClinicPaymentRow[]>("clinic_payments", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (error || !data?.[0]) {
    return { data: null, error: error || "Could not save payment." };
  }

  return { data: mapPaymentRow(data[0]), error: null };
}

export async function softDeleteClinicPayment(id: string) {
  return supabaseRest<ClinicPaymentRow[]>(`clinic_payments?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
}

export function aggregatePaymentsByClinic(payments: ClinicPaymentRow[]) {
  const byClinic = new Map<
    string,
    {
      clinicId: string;
      clinicName: string;
      total: number;
      count: number;
      methods: Record<PaymentMethod, number>;
    }
  >();

  for (const payment of payments) {
    const existing = byClinic.get(payment.clinic_id);
    const clinicName = payment.clinics?.name || "Clinic";
    if (existing) {
      existing.total += payment.amount;
      existing.count += 1;
      existing.methods[payment.payment_method] += payment.amount;
    } else {
      const methods: Record<PaymentMethod, number> = { UPI: 0, Cash: 0, Card: 0, Other: 0 };
      methods[payment.payment_method] = payment.amount;
      byClinic.set(payment.clinic_id, {
        clinicId: payment.clinic_id,
        clinicName,
        total: payment.amount,
        count: 1,
        methods,
      });
    }
  }

  return [...byClinic.values()].sort((a, b) => b.total - a.total);
}

export function aggregatePaymentMethods(payments: ClinicPaymentRow[]) {
  const methods: Record<PaymentMethod, number> = { UPI: 0, Cash: 0, Card: 0, Other: 0 };
  for (const payment of payments) {
    methods[payment.payment_method] += payment.amount;
  }
  return methods;
}
