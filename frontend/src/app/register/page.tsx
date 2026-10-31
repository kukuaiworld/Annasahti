"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2, AlertCircle, Leaf, ShieldAlert } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await signUp(email, password, contactName);
      if (error) {
        setErrorMessage(error.message || "Failed to create account with Supabase Auth.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Register Account" }]} />

      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Join FoodLoop</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register your secure account to participate in surplus food recovery
          </p>
        </div>

        {success ? (
          <div className="bg-white p-8 rounded-3xl border border-emerald-300 shadow-sm text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Account Created Successfully!</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Your FoodLoop account has been registered with Supabase Auth. If email confirmation is enabled, please verify your email address.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Account Provisioning Note:</span>
              </div>
              <p>
                In accordance with FoodLoop security and FSSAI standards, application roles (Donor, Inspector, Recipient) are granted by organisation administrators or verified through the platform directorate. Unprovisioned accounts cannot execute sensitive operations.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            {errorMessage && (
              <div className="p-4 mb-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organisation Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grand Banquet / City Shelter (Optional)"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@organisation.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                <span className="font-bold block">Verified Food Safety Policy:</span>
                <span>
                  Self-registration creates an authenticated profile. Platform privileges and organization access are validated against verified credentials before food redistribution is permitted.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span>Registering Account with Supabase...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              <span>Already registered? </span>
              <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
                Sign in here
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
