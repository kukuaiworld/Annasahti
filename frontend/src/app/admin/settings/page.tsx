"use client";

import { useState } from "react";
import { Settings, Save, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { storageService } from "@/services/storageService";

export default function AdminSettingsPage() {
  const [maxRadius, setMaxRadius] = useState(8);
  const [hotTempMin, setHotTempMin] = useState(60);
  const [coldTempMax, setColdTempMax] = useState(5);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [saved, setSaved] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetDemoData = () => {
    if (confirm("Reset all donations, requests, and logs back to default demo data?")) {
      storageService.resetDemoData();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Matching Engine & FSSAI Parameters"
        subtitle="Global algorithm thresholds, temperature safety limits and demo database controls"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-4xl">
        <Breadcrumbs items={[{ label: "Admin Portal", href: "/admin/dashboard" }, { label: "Engine Configuration" }]} />

        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Algorithm parameters updated across active city nodes!</span>
          </div>
        )}

        {resetDone && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 text-blue-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>All local demo data successfully reset to default factory state!</span>
          </div>
        )}

        {/* Global Settings Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
                1. Matching Radius & Routing Constants
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Urban Matching Radius (km)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={maxRadius}
                    onChange={(e) => setMaxRadius(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Deliveries beyond this radius require specialized refrigerated vans
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Automated Courier Dispatch</span>
                    <span className="text-[11px] text-slate-500">Pair top-scoring matches without manual staff approval</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDispatch}
                    onChange={(e) => setAutoDispatch(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
                2. FSSAI Safe Food Handover Thresholds
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hot Food Minimum Core Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={hotTempMin}
                    onChange={(e) => setHotTempMin(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Consignments below this temperature divert to Tier 3/4
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cold Food Maximum Storage Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={coldTempMax}
                    onChange={(e) => setColdTempMax(Number(e.target.value))}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Must stay under 5°C throughout cold chain transit
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Directorate Rules</span>
              </button>
            </div>
          </form>

          {/* Reset Demo Data Action */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Reset Demo State</h4>
              <p className="text-[11px] text-slate-500">
                Purge simulated donations, requests and restore initial default showcase data.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
