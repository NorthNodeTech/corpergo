import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, User, Stethoscope, Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/LOGO.webp";
import { signInWithPassword, resolvePostLoginPath } from "@/lib/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PORTALS = [
  {
    id: "patient",
    label: "Patient",
    icon: User,
    desc: "Book & track appointments",
    buttonLabel: "Patient",
  },
  {
    id: "staff",
    label: "Physiotherapist",
    icon: Stethoscope,
    desc: "Clinic staff login — physiotherapists and admins. Your dashboard opens by role.",
    buttonLabel: "Staff",
  },
] as const;

type PortalId = (typeof PORTALS)[number]["id"];

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const [portal, setPortal] = useState<PortalId>("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = PORTALS.find((p) => p.id === portal)!;

  // Clear inputs when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const isPatient = portal === "patient";
    const identifier = isPatient ? phone.trim() : email.trim();

    if (isPatient && !fullName.trim()) {
      setError("Enter your full name.");
      return;
    }

    if (!identifier || !password) {
      setError(isPatient ? "Enter your mobile number and password." : "Enter your email and password.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await signInWithPassword(identifier, password, isPatient ? fullName.trim() : undefined);

    if (signInError || !data) {
      setLoading(false);
      setError(signInError || "Sign in failed.");
      return;
    }

    const { path, error: portalError } = await resolvePostLoginPath(portal);
    setLoading(false);

    if (portalError || !path) {
      setError(portalError || "You don’t have access to this portal.");
      return;
    }

    onClose();
    void navigate({ to: path });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="p-0 overflow-hidden max-w-[calc(100vw-2rem)] sm:max-w-md border-none bg-transparent shadow-2xl">
        <div className="flex flex-col justify-center overflow-y-auto overscroll-contain max-h-[85vh] px-5 py-6 sm:px-8 sm:py-8 bg-white rounded-3xl relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex w-full max-w-sm flex-col"
          >
            {/* Brand logo header */}
            <div className="flex flex-col items-center mb-3 text-center">
              <div className="inline-flex items-center justify-center rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/10">
                <img
                  src={logoImg}
                  alt="CorpErgo"
                  className="w-auto h-11 object-contain"
                  width={120}
                  height={64}
                  decoding="async"
                />
              </div>
              <div className="mt-2 font-black text-[var(--ink)] text-sm sm:text-base leading-none tracking-wide">
                CORPERGO
                <div className="text-[9px] sm:text-[10px] font-bold text-[var(--ink-soft)] tracking-widest mt-0.5">
                  PHYSIOTHERAPY AND REHABILITATION
                </div>
              </div>
            </div>

            <h2 className="font-extrabold tracking-tight text-[var(--ink)] text-2xl text-center">
              Welcome back
            </h2>
            <p className="text-[var(--ink-soft)] text-sm mt-1 text-center">
              Sign in to continue to your dashboard.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--ivory)]/50 p-1 ring-1 ring-black/5">
              {PORTALS.map((p) => {
                const isActive = p.id === portal;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPortal(p.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-all cursor-pointer focus:outline-none ${
                      isActive
                        ? "bg-[var(--sage)] text-white shadow-sm"
                        : "text-[var(--ink-soft)] hover:bg-[var(--ivory)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-[10px] text-[var(--ink-soft)] leading-relaxed text-center">
              {active.desc}
            </div>

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              {portal === "patient" ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                      className="mt-1.5 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      autoComplete="tel"
                      required
                      className="mt-1.5 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      className="mt-1.5 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@corpergo.in"
                    autoComplete="email"
                    required
                    className="mt-1.5 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-2xl bg-white ring-1 ring-black/[0.08] pl-4 pr-10 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[var(--ink-soft)] hover:text-[var(--sage)] focus:outline-none rounded-lg transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] mt-1">
                <label className="flex items-center gap-2 text-[var(--ink-soft)] cursor-pointer">
                  <input type="checkbox" className="rounded accent-[var(--pink-main)]" /> Remember me
                </label>
                <a href="#" className="font-semibold text-[var(--sage)] hover:underline">
                  Forgot password?
                </a>
              </div>

              {error ? (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 ring-1 ring-red-100">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-sm hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none cursor-pointer focus:outline-none"
              >
                {loading ? "Signing in…" : `Sign in as ${active.buttonLabel}`}
                {!loading ? (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                ) : null}
              </button>
            </form>

            {portal === "patient" ? (
              <div className="mt-4 text-center text-xs text-[var(--ink-soft)]">
                New patient?{" "}
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="font-semibold text-[var(--sage-deep)] hover:underline"
                >
                  Create an account
                </Link>
              </div>
            ) : (
              <div className="mt-4 text-center text-xs text-[var(--ink-soft)]">
                Staff accounts are created by CorpErgo admin.
              </div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

