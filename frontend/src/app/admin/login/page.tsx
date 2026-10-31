"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMessage(error.message || "Invalid staff directorate credentials.");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate administrator session.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600/20 border border-red-500/40 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-3 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white">Central Admin Directorate</h1>
          <p className="text-xs text-slate-400 mt-1">
            Restricted access for FoodLoop platform administrators and compliance leads
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          {errorMessage && (
            <div className="p-4 mb-5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Staff Directorate Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@foodloop.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Directorate Security Passcode
              </label>
              <input
                type="password"
                required
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? "Authenticating Staff Session..." : "Access Admin Command Center"}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
