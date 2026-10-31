"use client";

import { useState } from "react";
import { BarChart3, Download, CheckCircle2, ShieldCheck, Printer } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function AdminReportsPage() {
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="National Food Recovery Impact & Analytics Directorate"
        subtitle="Consolidated metrics across Delhi NCR, Bengaluru, Mumbai and Hyderabad hubs"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-6xl">
        <Breadcrumbs items={[{ label: "Admin Portal", href: "/admin/dashboard" }, { label: "Impact Reports" }]} />

        {/* Aggregated Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">National Rescued</span>
            <div className="text-2xl font-black text-slate-900 mt-1">14,250 kg</div>
            <p className="text-[10px] text-emerald-600 mt-0.5">Across 420 missions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Total Meals Distributed</span>
            <div className="text-2xl font-black text-purple-700 mt-1">38,900</div>
            <p className="text-[10px] text-purple-600 mt-0.5">Orphanages & shelters</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Total Avoided CO₂e</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">34.20 Tons</div>
            <p className="text-[10px] text-emerald-600 mt-0.5">Methane prevention factor</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Freshwater Spared</span>
            <div className="text-2xl font-black text-blue-700 mt-1">856,000 L</div>
            <p className="text-[10px] text-blue-600 mt-0.5">Irrigation footprint</p>
          </div>
        </div>

        {/* Export Panel */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">National Operations Audit Export</h3>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Generate formal reporting dossiers for NITI Aayog, Ministry of Consumer Affairs, Food and Public Distribution,
            and FSSAI surplus food recovery division.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            {downloaded ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Consolidated Directorate Dossier Exported (CSV + PDF)!</span>
              </div>
            ) : (
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Full National Audit Dossier</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-slate-200"
            >
              <Printer className="w-4 h-4" />
              <span>Print Executive Summary</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
