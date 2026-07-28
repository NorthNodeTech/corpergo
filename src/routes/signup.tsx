import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/LOGO.webp";
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      phone,
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    // If session was created (email auto-confirmed), go straight to patient portal
    if (getStoredSession()) {
      setSuccess("Account created. Opening your portal…");
      window.setTimeout(() => {
        void navigate({ to: "/patient/dashboard" });
      }, 600);
      return;
    }

    setSuccess("Account created. You can sign in now.");
    window.setTimeout(() => {
      void navigate({ to: "/login" });
    }, 900);
  }

  return (
    <main className="min-h-screen bg-[var(--ivory)] grid lg:grid-cols-2">
      <div
        className="relative hidden lg:block overflow-hidden"
        style={{ background: "linear-gradient(135deg, #06261E 0%, #0F6B58 60%, #00A896 100%)" }}
      >
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[var(--pink-main)]/25 blur-3xl" />
        <div className="absolute inset-0 grain opacity-60" />

        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3.5 py-1.5 text-xs font-semibold ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5" /> Patient registration
            </div>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight leading-[1.05] text-balance">
              Start your recovery with CorpErgo.
            </h1>
            <p className="mt-5 text-white/85 text-lg max-w-md">
              Create a patient account to book assessments, view prescriptions,
              and follow your progress across our Bengaluru clinics.
            </p>
          </div>

          <img
            src={logoImg}
            alt="CorpErgo"
            className="h-20 w-auto object-contain object-left drop-shadow-md sm:h-24"
            width={96}
            height={96}
            decoding="async"
          />
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 space-y-5">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
            <img
              src={logoImg}
              alt="CorpErgo"
              className="h-16 w-auto object-contain object-left sm:h-20"
              width={72}
              height={72}
              decoding="async"
            />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            Create patient account
          </h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Physiotherapist and admin accounts are issued by CorpErgo — only
            patients can self-register.
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="mt-2 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-5 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="mt-2 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-5 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                Phone <span className="font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 …"
                autoComplete="tel"
                className="mt-2 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-5 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-2xl bg-white ring-1 ring-black/[0.08] pl-5 pr-12 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-[var(--ink-soft)] hover:text-[var(--sage)] focus:outline-none rounded-lg transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">
                Confirm password
              </label>
              <div className="relative mt-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="w-full rounded-2xl bg-white ring-1 ring-black/[0.08] pl-5 pr-12 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-[var(--ink-soft)] hover:text-[var(--sage)] focus:outline-none rounded-lg transition-colors"
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
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 ring-1 ring-red-100">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="text-sm text-[var(--sage-deep)] bg-[var(--sage)]/10 rounded-xl px-4 py-3 ring-1 ring-[var(--sage)]/20">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] px-5 py-3.5 text-sm font-semibold text-white transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elev)] hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Creating account…" : "Create patient account"}
              {!loading ? (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              ) : null}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--ink-soft)]">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-[var(--sage)] hover:underline">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
