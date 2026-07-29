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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = PORTALS.find((p) => p.id === portal)!;

  // Clear inputs when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await signInWithPassword(email, password);

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
        <div className="flex flex-col justify-center overflow-y-auto overscroll-contain px-6 py-10 sm:px-10 bg-white rounded-3xl relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex w-full max-w-sm flex-col"
          >
            {/* Brand logo header */}
            <div className="flex flex-col items-center mb-4">
              <img
                src={logoImg}
                alt="CorpErgo"
                className="w-auto h-16 object-contain"
                width={120}
                height={64}
                decoding="async"
              />
            </div>

            <h2 className="font-extrabold tracking-tight text-[var(--ink)] text-2xl text-center">
              Welcome back
            </h2>
            <p className="text-[var(--ink-soft)] text-sm mt-1 text-center">
              Sign in to continue to your dashboard.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--ivory)]/50 p-1.5 ring-1 ring-black/5">
              {PORTALS.map((p) => {
                const isActive = p.id === portal;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPortal(p.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-all cursor-pointer focus:outline-none ${
                      isActive
                        ? "bg-[var(--sage)] text-white shadow-[var(--shadow-soft)]"
                        : "text-[var(--ink-soft)] hover:bg-[var(--ivory)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-[10px] text-[var(--ink-soft)] leading-relaxed text-center">
              {active.desc}
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                />
              </div>
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

              <div className="flex items-center justify-between text-[11px]">
                <label className="flex items-center gap-2 text-[var(--ink-soft)] cursor-pointer">
                  <input type="checkbox" className="rounded accent-[var(--pink-main)]" /> Remember me
                </label>
                <a href="#" className="font-semibold text-[var(--sage)] hover:underline">
                  Forgot password?
                </a>
              </div>

              {error ? (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2.5 ring-1 ring-red-100">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] px-4 py-3 text-sm font-semibold text-white transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elev)] hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none cursor-pointer focus:outline-none"
              >
                {loading ? "Signing in…" : `Sign in as ${active.buttonLabel}`}
                {!loading ? (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                ) : null}
              </button>
            </form>

            {portal === "patient" ? (
              <div className="mt-5 text-center text-xs text-[var(--ink-soft)]">
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
              <div className="mt-5 text-center text-xs text-[var(--ink-soft)]">
                Staff accounts are created by CorpErgo admin.
              </div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

