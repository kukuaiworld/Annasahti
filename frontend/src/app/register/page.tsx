"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Building,
  Truck,
  HeartHandshake,
  PawPrint,
  Factory,
  CheckCircle2,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { Role } from "@/types";
import { storageService } from "@/services/storageService";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("donor");
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Delhi NCR");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [success, setSuccess] = useState(false);

  const roleRedirectMap: Record<Role, string> = {
    donor: "/donor/dashboard",
    volunteer: "/volunteer/dashboard",
    recipient: "/recipient/dashboard",
    "animal-welfare": "/animal-welfare/dashboard",
    processor: "/processor/dashboard",
    admin: "/admin/dashboard",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newUser = {
      id: "usr-" + Date.now(),
      name: contactName,
      email,
      role,
      organization: orgName || contactName,
      phone,
      city,
      verificationStatus: "verified" as const,
      fssaiNumber: licenseNumber || "FSSAI-DEMO-2026",
      joinedAt: new Date().toISOString().slice(0, 10),
    };

    const currentUsers = storageService.getUsers();
    storageService.updateUserVerification(newUser.id, "verified");

    storageService.addAuditLog({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: contactName,
      role,
      action: "NEW_ORGANIZATION_REGISTERED",
      details: `Registered ${orgName || contactName} as ${role.toUpperCase()} in ${city}`,
      ipAddress: "127.0.0.1",
    });

    setSuccess(true);
    setTimeout(() => {
      router.push(roleRedirectMap[role]);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Register Organization" }]} />

      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-md">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Join the AnnaSathi Network</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose your organization role to unlock your tailored redistribution portal
          </p>
        </div>

        {success ? (
          <div className="bg-white p-8 rounded-3xl border border-emerald-300 shadow-sm text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Account Verified & Activated!</h3>
            <p className="text-xs text-slate-600">
              Redirecting you to your dedicated {role.toUpperCase()} dashboard...
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            {/* Step 1: Role Selector */}
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              1. Select Your Stakeholder Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {[
                { r: "donor" as Role, label: "Food Donor", icon: Building },
                { r: "volunteer" as Role, label: "Volunteer Courier", icon: Truck },
                { r: "recipient" as Role, label: "Recipient NGO", icon: HeartHandshake },
                { r: "animal-welfare" as Role, label: "Animal Shelter", icon: PawPrint },
                { r: "processor" as Role, label: "Bio-Energy Unit", icon: Factory },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = role === item.r;
                return (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => setRole(item.r)}
                    className={`p-3 rounded-2xl text-left border flex flex-col justify-between transition ${
                      isSelected
                        ? "border-brand-600 bg-brand-50 ring-2 ring-brand-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-brand-600" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Step 2: Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 pt-2 border-t border-slate-100">
                2. Organization & Credential Details
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Commercial Entity Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    role === "donor"
                      ? "e.g. Royal Palace Banquets"
                      : role === "volunteer"
                      ? "e.g. Self / Electric Courier Group"
                      : "e.g. Bal Seva Orphanage Trust"
                  }
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98000 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="ops@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Hub</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option>Delhi NCR</option>
                    <option>Bengaluru</option>
                    <option>Mumbai</option>
                    <option>Hyderabad</option>
                    <option>Chennai</option>
                    <option>Pune</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {role === "donor"
                    ? "FSSAI License / Registration No."
                    : role === "recipient"
                    ? "NGO Darpan ID / Trust Registration No."
                    : role === "volunteer"
                    ? "Driver's License / Vehicle Registration"
                    : "Pollution Control Board / Municipal Reg. No."}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10018011003421"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-start gap-2 pt-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  By registering, you agree to adhere to FSSAI safe food handling protocols and the Good Samaritan Act guidelines.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Complete Registration & Open Dashboard
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              <span>Already registered? </span>
              <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
