import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ArrowRight, User, Stethoscope, ShieldCheck, Sparkles } from "lucide-react";
import logoAsset from "@/assets/corpergo-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — CorpErgo Physiotherapy" },
      { name: "description", content: "Secure sign-in for patients, physiotherapists and administrators at CorpErgo." },
    ],
  }),
});

const ROLES = [
  { id: "patient", label: "Patient", icon: User, desc: "Book & track appointments" },
  { id: "physio", label: "Physiotherapist", icon: Stethoscope, desc: "Manage sessions & patients" },
  { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Analytics & clinic overview" },
];

function LoginPage() {
  const [role, setRole] = useState("patient");

  return (
    <main className="min-h-screen bg-[var(--ivory)] grid lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden lg:block overflow-hidden" style={{ background: "linear-gradient(135deg, #47563F 0%, #5D725E 60%, #6F9E9C 100%)" }}>
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[var(--bronze)]/20 blur-3xl" />
        <div className="absolute inset-0 grain opacity-60" />

        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5" /> CorpErgo Portal
            </div>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight leading-[1.05] text-balance">
              Your recovery journey, all in one place.
            </h1>
            <p className="mt-5 text-white/80 text-lg max-w-md">
              Manage appointments, view reports and stay connected with your
              physiotherapist across all five CorpErgo clinics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
              <img src={logoAsset.url} alt="CorpErgo" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <div className="font-bold">CorpErgo Physiotherapy</div>
              <div className="text-xs text-white/60">Bengaluru · 5 Clinics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)]">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">Welcome back</h2>
          <p className="mt-2 text-[var(--ink-soft)]">Sign in to continue to your dashboard.</p>

          {/* Role tabs */}
          <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 ring-1 ring-black/5">
            {ROLES.map((r) => {
              const active = r.id === role;
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`relative flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-semibold transition-all ${
                    active ? "bg-[var(--sage)] text-white shadow-[var(--shadow-soft)]" : "text-[var(--ink-soft)] hover:bg-[var(--ivory)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {r.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-[var(--ink-soft)]">
            {ROLES.find((r) => r.id === role)?.desc}
          </div>

          <form className="mt-7 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">Email or Phone</label>
              <input
                type="text"
                placeholder="you@corpergo.in"
                className="mt-2 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-5 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--ink-soft)]">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl bg-white ring-1 ring-black/[0.08] px-5 py-3.5 text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:ring-2 focus:ring-[var(--sage)] focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[var(--ink-soft)]">
                <input type="checkbox" className="rounded" /> Remember me
              </label>
              <a href="#" className="font-semibold text-[var(--sage-deep)] hover:underline">Forgot password?</a>
            </div>

            <button
              type="button"
              className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--sage)] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[var(--sage-deep)] transition-all shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elev)]"
            >
              Sign in as {ROLES.find((r) => r.id === role)?.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--ink-soft)]">
            New patient? <a href="#" className="font-semibold text-[var(--sage-deep)] hover:underline">Create an account</a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
