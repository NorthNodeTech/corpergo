import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Wallet,
  Smartphone,
  User,
  Phone,
  FileText,
  CheckCircle2,
  TrendingUp,
  Receipt,
  Search,
  X,
} from "lucide-react";

export type PaymentRecord = {
  id: string;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  amount: number;
  paymentMethod: "UPI" | "Cash" | "Card" | "Other";
  notes?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdAt: string;
};

interface ClinicPaymentsTrackerProps {
  clinicId?: string;
  clinicName?: string;
}

const STORAGE_PREFIX = "corpergo.clinic_payments.";

function getTodayIso() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTimeStr() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function ClinicPaymentsTracker({ clinicId = "clinic-1", clinicName = "CorpErgo Clinic" }: ClinicPaymentsTrackerProps) {
  const storageKey = `${STORAGE_PREFIX}${clinicId}`;
  
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPhone] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Cash" | "Card" | "Other">("UPI");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState<string>(getTodayIso());

  // Load stored payments
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setPayments(JSON.parse(raw));
      } else {
        // Seed default sample payments for demo date
        const today = getTodayIso();
        const seed: PaymentRecord[] = [
          {
            id: `pay-${Date.now()}-1`,
            clinicId,
            patientName: "Rahul Sharma",
            patientPhone: "+91 98765 12345",
            amount: 850,
            paymentMethod: "UPI",
            notes: "Physiotherapy Assessment & Spine Session",
            date: today,
            time: "10:30 AM",
            createdAt: new Date().toISOString(),
          },
          {
            id: `pay-${Date.now()}-2`,
            clinicId,
            patientName: "Priya Patel",
            patientPhone: "+91 98123 45678",
            amount: 1200,
            paymentMethod: "Cash",
            notes: "Post-op Knee Rehab (Session 3)",
            date: today,
            time: "11:45 AM",
            createdAt: new Date().toISOString(),
          },
        ];
        setPayments(seed);
        localStorage.setItem(storageKey, JSON.stringify(seed));
      }
    } catch {
      setPayments([]);
    }
  }, [storageKey, clinicId]);

  // Save payments to localStorage
  const savePayments = (updated: PaymentRecord[]) => {
    setPayments(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save payment record", e);
    }
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim() || !amount || Number(amount) <= 0) {
      return;
    }

    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clinicId,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      amount: parseFloat(amount),
      paymentMethod,
      notes: notes.trim() || "Physiotherapy Session",
      date: paymentDate || getTodayIso(),
      time: getCurrentTimeStr(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...payments];
    savePayments(updated);

    // Reset Form
    setPatientName("");
    setPhone("");
    setAmount("");
    setNotes("");
    setPaymentMethod("UPI");
    setIsFormOpen(false);

    // Show toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleDeletePayment = (id: string) => {
    if (window.confirm("Are you sure you want to remove this payment record?")) {
      const updated = payments.filter((p) => p.id !== id);
      savePayments(updated);
    }
  };

  // Filter payments by selected date & search query
  const dayPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesDate = p.date === selectedDate;
      if (!matchesDate) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.patientName.toLowerCase().includes(q) ||
        p.patientPhone.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [payments, selectedDate, searchQuery]);

  // Daily Totals & Method Breakdowns
  const totalDayCollection = useMemo(() => {
    return dayPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [dayPayments]);

  const methodBreakdown = useMemo(() => {
    const breakdown = { UPI: 0, Cash: 0, Card: 0, Other: 0 };
    dayPayments.forEach((p) => {
      breakdown[p.paymentMethod] += p.amount;
    });
    return breakdown;
  }, [dayPayments]);

  return (
    <div className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-4 sm:p-6 shadow-sm">
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-xl text-sm font-semibold"
          >
            <CheckCircle2 className="h-5 w-5" />
            Payment recorded successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--pink-main)]/10 text-[var(--pink-main)]">
              <Receipt className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-extrabold text-[var(--ink)]">
              Clinic Payments &amp; Collections
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Record manual patient collections and view daily totals for {clinicName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Record Payment
        </button>
      </div>

      {/* Filter & Summary Section */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {/* Date Selector & Search */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--ivory)]/40 p-4 space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Select Collection Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--sage)]"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-soft)] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
              Filter by Patient Name / Phone
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient..."
                className="w-full rounded-xl border border-[var(--border)] bg-white pl-9 pr-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--sage)]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-soft)]" />
            </div>
          </div>
        </div>

        {/* Daily Total Collection Display */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Daily Total Collection
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                {selectedDate === getTodayIso() ? "Today" : selectedDate}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1 text-3xl sm:text-4xl font-black text-emerald-900">
              <span className="text-xl font-bold text-emerald-700">₹</span>
              {totalDayCollection.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <TrendingUp className="h-4 w-4" />
            <span>{dayPayments.length} payment record(s) on this day</span>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-2">
            Payment Mode Breakdown
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-800">
                <Smartphone className="h-3.5 w-3.5 text-purple-600" />
                UPI
              </div>
              <div className="mt-1 text-base font-extrabold text-purple-900">
                ₹{methodBreakdown.UPI.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <Wallet className="h-3.5 w-3.5 text-amber-600" />
                Cash
              </div>
              <div className="mt-1 text-base font-extrabold text-amber-900">
                ₹{methodBreakdown.Cash.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800">
                <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                Card
              </div>
              <div className="mt-1 text-base font-extrabold text-blue-900">
                ₹{methodBreakdown.Card.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                <IndianRupee className="h-3.5 w-3.5 text-gray-500" />
                Other
              </div>
              <div className="mt-1 text-base font-extrabold text-gray-900">
                ₹{methodBreakdown.Other.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History List */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--ink)]">
            Transactions for {selectedDate}
          </h3>
          <span className="text-xs text-[var(--ink-soft)] font-medium">
            Showing {dayPayments.length} record(s)
          </span>
        </div>

        {dayPayments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center bg-[var(--ivory)]/30">
            <Receipt className="mx-auto h-8 w-8 text-[var(--ink-soft)] opacity-40 mb-2" />
            <p className="text-sm font-semibold text-[var(--ink)]">No payment records found for this date</p>
            <p className="text-xs text-[var(--ink-soft)] mt-1">
              Click &quot;Record Payment&quot; above to log patient payment details manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--ivory)] text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Mobile Number</th>
                  <th className="px-4 py-3">Treatment / Notes</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-white">
                {dayPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--ivory)]/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--ink-soft)] whitespace-nowrap">
                      {p.time}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--ink)]">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-[var(--ink-soft)]" />
                        {p.patientName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[var(--ink-soft)]">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 opacity-60" />
                        {p.patientPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--ink-soft)]">
                      {p.notes || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          p.paymentMethod === "UPI"
                            ? "bg-purple-100 text-purple-800"
                            : p.paymentMethod === "Cash"
                            ? "bg-amber-100 text-amber-800"
                            : p.paymentMethod === "Card"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700 text-base">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--pink-main)] text-white">
                    <Receipt className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-[var(--ink)] text-lg">
                      Record Patient Payment
                    </h3>
                    <p className="text-xs text-[var(--ink-soft)]">{clinicName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddPayment} className="mt-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full rounded-2xl border border-[var(--border)] pl-10 pr-4 py-2.5 text-sm text-[var(--ink)] focus:ring-2 focus:ring-[var(--sage)] focus:outline-none"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-soft)]" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-2xl border border-[var(--border)] pl-10 pr-4 py-2.5 text-sm text-[var(--ink)] focus:ring-2 focus:ring-[var(--sage)] focus:outline-none"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-soft)]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                      Amount Paid (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="500"
                        className="w-full rounded-2xl border border-[var(--border)] pl-8 pr-3 py-2.5 text-sm font-bold text-[var(--ink)] focus:ring-2 focus:ring-[var(--sage)] focus:outline-none"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--ink-soft)]">
                        ₹
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full rounded-2xl border border-[var(--border)] px-3 py-2.5 text-sm font-semibold text-[var(--ink)] focus:ring-2 focus:ring-[var(--sage)] focus:outline-none bg-white"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--ink)] focus:ring-2 focus:ring-[var(--sage)] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block mb-1">
                    Treatment / Notes (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Back rehab consultation"
                      className="w-full rounded-2xl border border-[var(--border)] pl-10 pr-4 py-2.5 text-sm text-[var(--ink)] focus:ring-2 focus:ring-[var(--sage)] focus:outline-none"
                    />
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-soft)]" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 rounded-2xl border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] py-2.5 text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
