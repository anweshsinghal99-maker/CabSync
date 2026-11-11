"use client";

import { useState } from "react";
import { CheckCircle2, GraduationCap, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { StudentProfile } from "@/lib/types";
import { isCampusEmailAllowed } from "@/lib/client-security";

export function AuthGate({ onVerified }: { onVerified: (profile: StudentProfile) => void }) {
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<StudentProfile["gender"]>("Female");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = email ? isCampusEmailAllowed(email) : false;

  async function verify(demo = false) {
    setLoading(true);
    setError("");
    const targetEmail = demo ? "student@thapar.edu" : email;

    if (!isCampusEmailAllowed(targetEmail)) {
      setError("Institutional email required: must end in .edu, .ac.in, or @thapar.edu.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, gender }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      onVerified(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-6 md:p-8 border border-slate-800 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <GraduationCap size={22} />
          </span>
          <div>
            <p className="eyebrow">Campus Security Gateway</p>
            <h2 className="text-xl font-bold text-white">Student Domain Verification</h2>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <Lock size={12} /> HMAC Secured
        </span>
      </div>

      <p className="mb-5 text-sm leading-6 text-slate-400">
        To safeguard student privacy and ensure physical ride-share safety, CabSync requires an institutional email from an accredited university or campus.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Institutional Email Address
          </label>
          <div className="relative">
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. your_name@thapar.edu or student@iitd.ac.in"
              type="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {emailValid && (
              <span className="absolute right-3 top-3 text-emerald-400" title="Valid campus domain">
                <CheckCircle2 size={16} />
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Approved domains: <code className="text-slate-400">.edu</code>,{" "}
            <code className="text-slate-400">.ac.in</code>,{" "}
            <code className="text-slate-400">@thapar.edu</code>
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">
            Gender Identity (Required for Female-Only Pod Access)
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as StudentProfile["gender"])}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="Female">Female (Eligible for Female-Only & Mixed Pods)</option>
            <option value="Male">Male (Mixed Pods)</option>
            <option value="Non-binary">Non-binary (Mixed Pods)</option>
            <option value="Prefer not to say">Prefer not to say (Mixed Pods)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="button-secondary justify-center py-2.5 border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/10"
          onClick={() => verify(true)}
          disabled={loading}
        >
          <ShieldCheck size={18} className="text-emerald-400" />
          Verify as Demo Student
        </button>

        <button
          type="button"
          className="button-primary justify-center py-2.5"
          onClick={() => verify(false)}
          disabled={loading || !email}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Lock size={16} /> Verify Campus Email
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-400 border border-slate-800">
        <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
        <span>
          Judges & evaluators: Click <strong>&quot;Verify as Demo Student&quot;</strong> for instant 1-tap authenticated session testing.
        </span>
      </div>
    </section>
  );
}
