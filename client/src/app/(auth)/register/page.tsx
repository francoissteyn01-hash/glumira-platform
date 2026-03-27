/**
 * GluMira™ Register Page
 * Version: 7.0.0
 * Route: /register
 *
 * Supabase Auth — email/password sign-up with beta participant ID.
 * Creates user in Supabase Auth + patient_profiles table.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type DiabetesType = "T1D" | "T2D" | "LADA" | "Other";

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  diabetesType: DiabetesType;
  betaCode: string;
  agreedToTerms: boolean;
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    diabetesType: "T1D",
    betaCode: "",
    agreedToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const validate = (): string | null => {
    if (!form.email.trim()) return "Email is required.";
    if (!form.password || form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.displayName.trim()) return "Display name is required.";
    if (!form.agreedToTerms) return "You must agree to the terms to continue.";
    return null;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validate();
      if (validationError) { setError(validationError); return; }

      setLoading(true);
      setError(null);

      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              display_name: form.displayName.trim(),
              diabetes_type: form.diabetesType,
              beta_code: form.betaCode.trim() || null,
            },
          },
        });

        if (authError) { setError(authError.message); return; }

        if (data.user) {
          // Create patient profile record
          await supabase.from("patient_profiles").insert({
            id: data.user.id,
            display_name: form.displayName.trim(),
            diabetes_type: form.diabetesType,
            status: form.betaCode.trim() ? "beta" : "pending",
            created_at: new Date().toISOString(),
          });
        }

        setSuccess(true);
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form, supabase]
  );

  const inputClass =
    "w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400";

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account created!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Check your email at <strong>{form.email}</strong> to verify your account, then sign in.
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 px-8 text-sm transition-colors"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo + Stacked Brand Unit */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GluMira™</h1>
          <p className="text-xs text-glumira-blue font-medium mt-1">The science of insulin, made visible</p>
          <p className="text-sm text-gray-400 mt-2">Create your free beta account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              id="email" type="email" required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
            <input
              id="name" type="text" required
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="e.g. NAM-001 or your first name"
              className={inputClass}
            />
          </div>

          {/* Diabetes Type */}
          <div>
            <label htmlFor="dtype" className="block text-sm font-medium text-gray-700 mb-1.5">Diabetes type</label>
            <select
              id="dtype"
              value={form.diabetesType}
              onChange={(e) => setForm((f) => ({ ...f, diabetesType: e.target.value as DiabetesType }))}
              className={inputClass}
            >
              {["T1D", "T2D", "LADA", "Other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="pw" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              id="pw" type="password" required minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Min. 8 characters"
              className={inputClass}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="cpw" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
            <input
              id="cpw" type="password" required
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Repeat password"
              className={inputClass}
            />
          </div>

          {/* Beta Code (optional) */}
          <div>
            <label htmlFor="beta" className="block text-sm font-medium text-gray-700 mb-1.5">
              Beta access code <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="beta" type="text"
              value={form.betaCode}
              onChange={(e) => setForm((f) => ({ ...f, betaCode: e.target.value }))}
              placeholder="e.g. BETA-2026"
              className={inputClass}
            />
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agreedToTerms}
              onChange={(e) => setForm((f) => ({ ...f, agreedToTerms: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I understand that GluMira™ is an educational tool only, not a medical device, and not a dosing tool. I will always consult my diabetes care team before making any management changes.
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.agreedToTerms}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
