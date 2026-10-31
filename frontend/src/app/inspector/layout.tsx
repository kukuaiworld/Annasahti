"use client";

import React from "react";
import Link from "next/link";
import InspectorSidebar from "@/components/inspector/InspectorSidebar";
import { useAuth } from "@/providers/auth-provider";
import { AppRole } from "@/types/auth";
import { ShieldAlert, LogIn, ArrowLeft } from "lucide-react";

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Verifying inspector credentials...</p>
        </div>
      </div>
    );
  }

  // Check if authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Authentication Required</h2>
          <p className="text-sm text-slate-400">
            Access to the FoodLoop Quality Inspection Portal is restricted to certified quality inspectors and authorized administrators.
          </p>
          <div className="pt-2">
            <Link
              href="/login?returnUrl=/inspector/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Continue</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cross-role access control check: Must be inspector or admin
  const isAuthorized = profile?.role === AppRole.INSPECTOR || profile?.role === AppRole.ADMIN;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-900/40 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Access Denied: Certified Role Required</h2>
          <p className="text-sm text-slate-400">
            Your authenticated profile is registered as <strong className="text-white capitalize">{profile?.role || "unprovisioned"}</strong>. 
            Only users with the <span className="text-teal-400 font-mono text-xs">inspector</span> or <span className="text-teal-400 font-mono text-xs">admin</span> role are authorized to inspect food consignments and render certification decisions.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <InspectorSidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
