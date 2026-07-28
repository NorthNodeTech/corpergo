import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, User, Stethoscope, Sparkles, Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/LOGO.webp";
import loginImg from "@/assets/login.webp";
import { signInWithPassword, resolvePostLoginPath } from "@/lib/auth";

/** Shrinks the mobile logo as the visual viewport collapses (on-screen keyboard). */
function useKeyboardAwareLogoHeight() {
  const [height, setHeight] = useState(210);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;

    const update = () => {
      const layoutH = window.innerHeight || 1;
      const visualH = vv?.height ?? layoutH;
      const ratio = Math.min(1, visualH / layoutH);
      // Full (~210px) → keyboard (~70px)
      setHeight(Math.round(70 + ratio * 140));
      setCompact(ratio < 0.78);
    };

    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { height, compact };
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — CorpErgo Physiotherapy" },
      {
        name: "description",
        content:
          "Secure sign-in for patients and clinic staff at CorpErgo. Administrators use staff login.",
      },
    ],
  }),
});

/** UI portal choice only — admin accounts use the staff (physiotherapist) form. */
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

function LoginPage() {
  const navigate = useNavigate();
  const { height: logoHeight, compact } = useKeyboardAwareLogoHeight();
  const [portal, setPortal] = useState<PortalId>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = PORTALS.find((p) => p.id === portal)!;

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

    void navigate({ to: path });
  }

  return (
    <main className="min-h-dvh bg-[var(--ivory)] grid lg:grid-cols-2">
      <div
        className="relative hidden lg:block overflow-hidden"
        style={{ background: "linear-gradient(135deg, #06261E 0%, #0F6B58 60%, #00A896 100%)" }}
      >
        <img 
          src={loginImg} 
          alt="Background" 
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay" 
        />
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
            <h1 className="text-5xl font-extrabold tracking-tight leading-[1.05] text-balance">
              Your recovery journey, all in one place.
            </h1>
            <p className="mt-5 text-white/85 text-lg max-w-md">
              Manage appointments, view reports and stay connected with your
              physiotherapist across all five CorpErgo clinics.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={logoImg}
              alt="CorpErgo"
              className="h-20 w-auto object-contain object-left drop-shadow-md sm:h-24"
              width={96}
              height={96}
              decoding="async"
            />
            <div className="border-l border-white/20 pl-4">
              <div className="text-sm font-semibold tracking-wide">Physiotherapy</div>
              <div className="text-xs text-white/70 mt-0.5">Bengaluru · 5 Clinics</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col overflow-y-auto overscroll-contain px-6 py-5 sm:px-12 sm:py-10 lg:min-h-0 lg:items-center lg:justify-center lg:overflow-visible lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col lg:flex-none"
        >
          {/* Mobile brand — large, centered; shrinks when keyboard opens */}
          <div className="lg:hidden">
            <motion.div
              animate={{ height: compact ? 0 : "auto", opacity: compact ? 0 : 1 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)]"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </motion.div>

            <motion.div
              animate={{
                paddingTop: compact ? 4 : 28,
                paddingBottom: compact ? 4 : 20,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="flex items-center justify-center"
            >
              <Link
                to="/"
                aria-label="CorpErgo Physiotherapy — Home"
                className="flex flex-col items-center"
              >
                <motion.img
                  src={logoImg}
                  alt="CorpErgo"
                  animate={{ height: logoHeight }}
                  transition={{ type: "spring", stiffness: 320, damping: 34 }}
                  className="w-auto max-w-[min(100%,18rem)] object-contain"
                  style={{ height: logoHeight }}
                  width={280}
                  height={280}
                  decoding="async"
                />
              </Link>
            </motion.div>
          </div>

          <h2
            className={`font-extrabold tracking-tight text-[var(--ink)] transition-[font-size] duration-200 ${
              compact ? "text-2xl" : "text-3xl"
            }`}
          >
            Welcome back
          </h2>
          <p
            className={`text-[var(--ink-soft)] transition-all duration-200 ${
              compact ? "mt-1 text-sm" : "mt-2"
            }`}
          >
            Sign in to continue to your dashboard.
          </p>

          <div
            className={`grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 ring-1 ring-black/5 transition-[margin] duration-200 ${
              compact ? "mt-4" : "mt-8"
            }`}
          >
            {PORTALS.map((p) => {
              const isActive = p.id === portal;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPortal(p.id)}
                  className={`relative flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[var(--sage)] text-white shadow-[var(--shadow-soft)]"
                      : "text-[var(--ink-soft)] hover:bg-[var(--ivory)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-[var(--ink-soft)] leading-relaxed">
            {active.desc}
          </div>

          <form
            className={`space-y-4 transition-[margin] duration-200 ${compact ? "mt-4" : "mt-7"}`}
            onSubmit={onSubmit}
          >
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
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[var(--ink-soft)] cursor-pointer">
                <input type="checkbox" className="rounded accent-[var(--pink-main)]" /> Remember me
              </label>
              <a href="#" className="font-semibold text-[var(--sage)] hover:underline">
                Forgot password?
              </a>
            </div>

            {error ? (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 ring-1 ring-red-100">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--pink-main)] hover:bg-[var(--pink-hover)] px-5 py-3.5 text-sm font-semibold text-white transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elev)] hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "Signing in…" : `Sign in as ${active.buttonLabel}`}
              {!loading ? (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              ) : null}
            </button>
          </form>

          {portal === "patient" ? (
            <div className="mt-6 text-center text-sm text-[var(--ink-soft)]">
              New patient?{" "}
              <Link
                to="/signup"
                className="font-semibold text-[var(--sage-deep)] hover:underline"
              >
                Create an account
              </Link>
            </div>
          ) : (
            <div className="mt-6 text-center text-sm text-[var(--ink-soft)]">
              Staff accounts are created by CorpErgo admin.
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
