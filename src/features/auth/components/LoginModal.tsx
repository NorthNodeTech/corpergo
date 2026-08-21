import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { CorpErgoLogo } from "@/shared/components/brand/CorpErgoLogo";
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";
import { signInWithPassword, resolvePostLoginPath } from "@/lib/auth";
import { cn } from "@/lib/core/utils";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRedirectTo?: string | null;
}

export function LoginModal({ isOpen, onClose, patientRedirectTo }: LoginModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError(null);
      setLoading(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await signInWithPassword(email.trim(), password);

    if (signInError || !data) {
      setLoading(false);
      setError(signInError || "Sign in failed.");
      return;
    }

    const { path, error: portalError } = await resolvePostLoginPath();
    setLoading(false);

    if (portalError || !path) {
      setError(portalError || "You don’t have access to this portal.");
      return;
    }

    const destination =
      path.startsWith("/patient") && patientRedirectTo?.startsWith("/patient")
        ? patientRedirectTo
        : path;

    onClose();
    void navigate({ to: destination });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col",
          "max-h-[min(92dvh,720px)] overflow-hidden border-none bg-transparent p-0 shadow-2xl",
          "sm:w-full sm:max-w-md",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.06]">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pr-10 sm:px-7 sm:py-7 sm:pr-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto flex w-full max-w-sm flex-col"
            >
              <div className="flex flex-col items-center text-center">
                <CorpErgoLogo size="lg" />
                <div className="corpergo-brand-title mt-3 text-base text-[var(--ink)] sm:text-lg">
                  <span className="text-[var(--saffron)]">Corp</span>Ergo
                </div>
                <div className="corpergo-brand-tagline">Physiotherapy &amp; Rehabilitation</div>
              </div>

              <h2 className="type-h2 mt-4 text-center font-extrabold tracking-tight text-[var(--ink)]">
                Welcome back
              </h2>
              <p className="type-body-sm mt-1 text-center text-[var(--ink-soft)]">
                Sign in with your email and password. We’ll open the right dashboard for your
                account.
              </p>

              <form className="mt-5 space-y-2.5 sm:space-y-3" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="login-email"
                    className="type-label font-bold text-[var(--ink-soft)]"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                    className="mt-1.5 w-full rounded-2xl bg-white px-4 py-2.5 text-sm text-[var(--ink)] ring-1 ring-black/[0.08] placeholder:text-[var(--ink-soft)]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--sage)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="type-label font-bold text-[var(--ink-soft)]"
                  >
                    Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="login-password"
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
                    <input type="checkbox" className="rounded accent-[var(--pink-main)]" /> Remember
                    me
                  </label>
                  <a
                    href="mailto:corpergo@gmail.com?subject=Password%20reset%20help"
                    className="font-semibold text-[var(--sage)] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 ring-1 ring-red-100"
                  >
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-sm hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none cursor-pointer focus:outline-none"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="text-white" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 pb-1 text-center text-xs text-[var(--ink-soft)]">
                New patient?{" "}
                <a
                  href={
                    patientRedirectTo?.startsWith("/patient")
                      ? `/signup?next=${encodeURIComponent(patientRedirectTo)}`
                      : "/signup"
                  }
                  onClick={onClose}
                  className="font-semibold text-[var(--sage-deep)] hover:underline"
                >
                  Create an account
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
