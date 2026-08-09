import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import { CorpErgoLogo } from "@/components/CorpErgoLogo";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getStoredSession, signUpPatient } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create account — CorpErgo Physiotherapy" },
      {
        name: "description",
        content: "Create your CorpErgo patient account to book appointments and track recovery.",
      },
    ],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const nextPath =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
  const patientDestination = nextPath?.startsWith("/patient") ? nextPath : "/patient/dashboard";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUpPatient({
      fullName,
      email,
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (getStoredSession()) {
      setSuccess("Account created. Opening your portal…");
      window.setTimeout(() => {
        void navigate({ to: patientDestination });
      }, 600);
      return;
    }

    setSuccess("Account created. You can sign in now.");
    window.setTimeout(() => {
      void navigate({ to: "/login" });
    }, 900);
  }

  return (
    <main className="min-h-dvh bg-[var(--ivory)] lg:grid lg:h-dvh lg:grid-cols-2 lg:overflow-hidden">
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{ background: "linear-gradient(135deg, #000000 0%, #1a1a1a 55%, #ff9933 100%)" }}
      >
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[var(--pink-main)]/25 blur-3xl" />
        <div className="absolute inset-0 grain opacity-60" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-12 text-white">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Patient registration
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-balance xl:text-5xl">
              Start your recovery with CorpErgo.
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/85">
              Create a patient account to book assessments, view prescriptions, and follow your
              progress across our Bengaluru clinics.
            </p>
          </div>

          <CorpErgoLogo size="xl" frameClassName="shadow-md ring-white/20" />
        </div>
      </div>

      <div className="flex min-h-dvh flex-col overflow-y-auto overscroll-contain lg:min-h-0 lg:h-full">
        <div className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.05] sm:p-7 lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0">
              <div className="mb-6 space-y-4 lg:hidden">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
                <div className="flex justify-center">
                  <CorpErgoLogo size="lg" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
                Create patient account
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)] sm:text-base">
                Physiotherapist and admin accounts are issued by CorpErgo — only patients can
                self-register. Your mobile number is collected when you book your first visit.
              </p>

              <form className="mt-6 space-y-3 sm:mt-8 sm:space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] sm:text-xs">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="mt-1.5 w-full rounded-2xl bg-white px-4 py-3 text-sm text-[var(--ink)] ring-1 ring-black/[0.08] placeholder:text-[var(--ink-soft)]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--sage)] sm:mt-2 sm:px-5 sm:py-3.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] sm:text-xs">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                    className="mt-1.5 w-full rounded-2xl bg-white px-4 py-3 text-sm text-[var(--ink)] ring-1 ring-black/[0.08] placeholder:text-[var(--ink-soft)]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--sage)] sm:mt-2 sm:px-5 sm:py-3.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] sm:text-xs">
                    Password
                  </label>
                  <div className="relative mt-1.5 sm:mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="w-full rounded-2xl bg-white py-3 pl-4 pr-11 text-sm text-[var(--ink)] ring-1 ring-black/[0.08] placeholder:text-[var(--ink-soft)]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--sage)] sm:py-3.5 sm:pl-5 sm:pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--ink-soft)] transition-colors hover:text-[var(--sage)] focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] sm:text-xs">
                    Confirm password
                  </label>
                  <div className="relative mt-1.5 sm:mt-2">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      className="w-full rounded-2xl bg-white py-3 pl-4 pr-11 text-sm text-[var(--ink)] ring-1 ring-black/[0.08] placeholder:text-[var(--ink-soft)]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--sage)] sm:py-3.5 sm:pl-5 sm:pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--ink-soft)] transition-colors hover:text-[var(--sage)] focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
                    {error}
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-xl bg-[var(--sage)]/10 px-4 py-3 text-sm text-[var(--sage-deep)] ring-1 ring-[var(--sage)]/20">
                    {success}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--pink-main)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-[var(--pink-hover)] hover:shadow-[var(--shadow-elev)] disabled:pointer-events-none disabled:opacity-60 sm:py-3.5"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="text-white" />
                      Creating account…
                    </>
                  ) : (
                    "Create patient account"
                  )}
                  {!loading ? (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  ) : null}
                </button>
              </form>

              <p className="mt-5 pb-2 text-center text-sm text-[var(--ink-soft)] sm:mt-6">
                Already registered?{" "}
                <Link to="/login" className="font-semibold text-[var(--sage)] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
