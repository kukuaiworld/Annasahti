"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogIn,
  ShieldCheck,
  Building,
  Truck,
  HeartHandshake,
  PawPrint,
  Factory,
  Lock,
  ArrowRight,
  Leaf,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Role } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("donor");
  const [email, setEmail] = useState("sunil@grandheritagecaterers.in");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const roleProfiles: Record<
    Role,
    { title: string; email: string; targetUrl: string; icon: any; color: string }
  > = {
    donor: {
      title: "Food Donor (Grand Heritage Banquets)",
      email: "sunil@grandheritagecaterers.in",
      targetUrl: "/donor/dashboard",
      icon: Building,
      color: "border-emerald-300 bg-emerald-50 text-emerald-800",
    },
    volunteer: {
      title: "Volunteer Courier (Aarav Sharma - EV)",
      email: "aarav.delhivol@annasathi.org",
      targetUrl: "/volunteer/dashboard",
      icon: Truck,
      color: "border-blue-300 bg-blue-50 text-blue-800",
    },
    recipient: {
      title: "Recipient Shelter (Asha Kiran Orphanage)",
      email: "trustee@ashakiran.ngo",
      targetUrl: "/recipient/dashboard",
      icon: HeartHandshake,
      color: "border-purple-300 bg-purple-50 text-purple-800",
    },
    "animal-welfare": {
      title: "Animal Welfare (Shri Krishna Gaushala)",
      email: "seva@krishnagaushala.org",
      targetUrl: "/animal-welfare/dashboard",
      icon: PawPrint,
      color: "border-amber-300 bg-amber-50 text-amber-900",
    },
    processor: {
      title: "Bio-Energy Processor (Delhi Urja BioCNG)",
      email: "operations@delhiurjabio.com",
      targetUrl: "/processor/dashboard",
      icon: Factory,
      color: "border-teal-300 bg-teal-50 text-teal-800",
    },
    admin: {
      title: "Staff Admin Directorate (Siddharth Nambiar)",
      email: "admin@annasathi.org",
      targetUrl: "/admin/dashboard",
      icon: Lock,
      color: "border-slate-400 bg-slate-100 text-slate-800",
    },
  };

  const handleRoleSelect = (roleKey: Role) => {
    setSelectedRole(roleKey);
    setEmail(roleProfiles[roleKey].email);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(roleProfiles[selectedRole].targetUrl);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Sign In" }]} />

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <Leaf className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sign In to AnnaSathi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your dedicated role dashboard and rescue portal
          </p>
        </div>

        {/* Demo Fast-Switch Buttons */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Instant Demo Account Switcher
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(roleProfiles) as Role[]).map((rKey) => {
              const item = roleProfiles[rKey];
              const Icon = item.icon;
              const isSelected = selectedRole === rKey;
              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => handleRoleSelect(rKey)}
                  className={`p-2 rounded-xl text-left border flex flex-col justify-between transition ${
                    isSelected
                      ? "border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? "text-brand-700" : "text-slate-500"}`} />
                  <span className="text-[10px] font-bold text-slate-800 capitalize leading-tight">
                    {rKey.replace("-", " ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className={`p-3 rounded-xl border mb-6 text-xs flex items-center gap-2.5 ${roleProfiles[selectedRole].color}`}>
            <span className="font-bold">Active Role:</span>
            <span className="truncate">{roleProfiles[selectedRole].title}</span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating Portal Access...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In as {selectedRole.toUpperCase()}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Don&apos;t have an organization account? </span>
            <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
