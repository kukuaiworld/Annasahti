"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, ShieldCheck, AlertCircle, Leaf } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useAuth } from "@/providers/auth-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/donor/dashboard";

  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMessage(error.message || "Failed to authenticate with Supabase Auth.");
        setLoading(false);
        return;
      }

      router.push(returnUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
      {errorMessage && (
        <div className="p-4 mb-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Official Account Email
          </label>
          <input
            type="email"
            required
            placeholder="name@organisation.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <label className="font-semibold text-slate-700">Password</label>
            <Link href="/forgot-password" className="text-brand-600 hover:text-brand-800 font-medium">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <span>Verifying credentials...</span>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>Don&apos;t have an account yet? </span>
        <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Sign In" }]} />

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sign In to FoodLoop</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your verified food rescue portal with Supabase authentication
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
              Loading authentication form...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
