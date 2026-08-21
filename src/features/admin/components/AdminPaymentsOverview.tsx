import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CreditCard,
  IndianRupee,
  Receipt,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ShowMoreButton, useShowMore } from "@/shared/components/layout/ShowMoreList";
import { LoadingSpinnerLabel } from "@/shared/components/ui/loading-spinner";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  aggregatePaymentMethods,
  aggregatePaymentsByClinic,
  fetchNetworkPaymentsForDate,
  type ClinicPaymentRow,
} from "@/lib/admin/clinic-payments-data";
import { cn, formatClinicName } from "@/lib/core/utils";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const METHOD_STYLES = {
  purple: "border-[var(--saffron)]/25 bg-[var(--saffron-light)]/80",
  amber: "border-amber-200/80 bg-amber-50/90",
  blue: "border-neutral-200 bg-neutral-50",
  gray: "border-black/10 bg-[var(--ivory)]",
} as const;

export function AdminPaymentsOverview() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [payments, setPayments] = useState<ClinicPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchNetworkPaymentsForDate(selectedDate).then(({ data, error: fetchError }) => {
      if (cancelled) return;
      if (fetchError) setError(fetchError);
      setPayments(data || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const networkTotal = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );
  const clinicTotals = useMemo(() => aggregatePaymentsByClinic(payments), [payments]);
  const methodBreakdown = useMemo(() => aggregatePaymentMethods(payments), [payments]);
  const clinicMore = useShowMore(clinicTotals);
  const paymentsMore = useShowMore(payments);

  useEffect(() => {
    clinicMore.collapse();
    paymentsMore.collapse();
  }, [selectedDate, clinicMore.collapse, paymentsMore.collapse]);

  return (
    <section id="admin-payments" className="scroll-mt-24">
      <article className="portal-card-outline overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-soft)]">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--card-border-strong)] px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--burnt-amber)]">
              Collections
            </div>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--ink)]">Network payments</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Daily collections across all clinics — summary, breakdown, and transactions in one view.
            </p>
          </div>
          <div className="portal-card-outline shrink-0 rounded-2xl bg-[var(--ivory)] px-3 py-2.5">
            <label
              htmlFor="admin-payment-date"
              className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]"
            >
              Collection date
            </label>
            <div className="relative">
              <input
                id="admin-payment-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full min-w-[10.5rem] rounded-xl border border-[var(--card-border-strong)] bg-white px-3 py-2 pr-9 text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--saffron)]/30"
              />
              <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-4 mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200 sm:mx-6">
            {error}
          </div>
        ) : null}

        {/* Summary row */}
        <div className="grid gap-4 border-b border-[var(--card-border-strong)] p-4 sm:p-6 lg:grid-cols-[minmax(220px,1fr)_2fr] lg:items-stretch">
          <div className="portal-card-outline flex min-h-[140px] flex-col rounded-2xl bg-[var(--saffron-light)]/70 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--burnt-amber)]">
                Network total
              </span>
              <Receipt className="h-4 w-4 shrink-0 text-[var(--saffron-deep)]" />
            </div>
            {loading ? (
              <Skeleton className="mt-4 h-10 w-32 rounded-lg" />
            ) : (
              <div className="type-h1 mt-auto flex items-baseline gap-1 pt-3 font-black text-[var(--ink)]">
                <span className="text-2xl font-bold text-[var(--saffron-deep)]">₹</span>
                {networkTotal.toLocaleString("en-IN")}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[var(--saffron-deep)]">
              <TrendingUp className="h-4 w-4 shrink-0" />
              {loading
                ? "Loading…"
                : `${payments.length} payment${payments.length === 1 ? "" : "s"} · ${clinicTotals.length} clinic${clinicTotals.length === 1 ? "" : "s"}`}
            </div>
          </div>

          <div className="portal-card-outline min-w-0 rounded-2xl bg-white p-4 sm:p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
              Payment mode breakdown
            </div>
            {loading ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { key: "UPI" as const, label: "UPI", icon: Smartphone, tone: "purple" as const },
                    { key: "Cash" as const, label: "Cash", icon: Wallet, tone: "amber" as const },
                    { key: "Card" as const, label: "Card", icon: CreditCard, tone: "blue" as const },
                    { key: "Other" as const, label: "Other", icon: IndianRupee, tone: "gray" as const },
                  ] as const
                ).map(({ key, label, icon: Icon, tone }) => (
                  <div
                    key={key}
                    className={cn(
                      "portal-card-outline min-h-[4.5rem] rounded-xl p-3",
                      METHOD_STYLES[tone],
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {label}
                    </div>
                    <div className="mt-1 text-lg font-extrabold tabular-nums text-[var(--ink)]">
                      ₹{methodBreakdown[key].toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* By clinic */}
        <div className="border-b border-[var(--card-border-strong)] px-4 py-5 sm:px-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
            By clinic
          </h3>
          {loading ? (
            <LoadingSpinnerLabel label="Loading clinic totals…" className="py-8" />
          ) : clinicTotals.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--ink-soft)]">
              No payment records for this date across the network.
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {clinicMore.visible.map((clinic) => (
                  <div
                    key={clinic.clinicId}
                    className="portal-card-outline min-h-[6.5rem] rounded-2xl bg-[var(--ivory)]/50 p-3 sm:p-4"
                  >
                    <div className="line-clamp-2 text-sm font-extrabold leading-snug text-[var(--ink)]">
                      {formatClinicName(clinic.clinicName)}
                    </div>
                    <div className="mt-2 text-xl font-black tabular-nums text-[var(--saffron-deep)] sm:text-2xl">
                      ₹{clinic.total.toLocaleString("en-IN")}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-[var(--ink-soft)]">
                      {clinic.count} payment{clinic.count === 1 ? "" : "s"}
                    </div>
                  </div>
                ))}
              </div>
              <ShowMoreButton
                hiddenCount={clinicMore.hiddenCount}
                expanded={clinicMore.expanded}
                onClick={clinicMore.toggle}
              />
            </>
          )}
        </div>

        {/* All transactions */}
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
            All transactions
          </h3>
          {loading ? (
            <div className="mt-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--ink-soft)]">
              No transactions for this date.
            </div>
          ) : (
            <>
              <div className="portal-card-outline mt-4 overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-[var(--ivory)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                      <tr className="border-b border-[var(--card-border-strong)]">
                        <th className="px-4 py-3">Clinic</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsMore.visible.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-[var(--card-border-strong)] last:border-b-0 hover:bg-[var(--ivory)]/40"
                        >
                          <td className="px-4 py-3 font-semibold text-[var(--ink)]">
                            {formatClinicName(payment.clinics?.name || "Clinic")}
                          </td>
                          <td className="px-4 py-3 font-bold text-[var(--ink)]">
                            {payment.patient_name}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-soft)]">{payment.patient_phone}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-bold uppercase">
                              {payment.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-black tabular-nums text-[var(--saffron-deep)]">
                            ₹{payment.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <ShowMoreButton
                hiddenCount={paymentsMore.hiddenCount}
                expanded={paymentsMore.expanded}
                onClick={paymentsMore.toggle}
              />
            </>
          )}
        </div>
      </article>
    </section>
  );
}
