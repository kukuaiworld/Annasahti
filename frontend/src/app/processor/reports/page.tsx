"use client";

import { useState } from "react";
import { BarChart2, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import ProcessorHeader from "@/components/processor/ProcessorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ProcessorReportsPage() {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <ProcessorHeader
        title="Circular Bio-Economy Compliance Reports"
        subtitle="Download municipal pollution control board landfill diversion certificates"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-4xl">
        <Breadcrumbs items={[{ label: "Processing Partner", href: "/processor/dashboard" }, { label: "Circular Reports" }]} />

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Landfill Waste Abatement Ledger</h3>
            <p className="text-xs text-slate-500">
              Approved by the State Pollution Control Board for commercial organic solid waste handling.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Certified Landfill Diversion Rate:</span>
              <span className="font-bold text-emerald-700">100.0% (Zero Landfill)</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Total Kitchen Slurry Processed:</span>
              <span className="font-bold text-slate-900">1,190 kg</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Avoided Landfill Methane Emissions:</span>
              <span className="font-bold text-teal-700">2.85 Tons CO₂e</span>
            </div>
          </div>

          <div>
            {downloaded ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Monthly Abatement Certificate Downloaded!</span>
              </div>
            ) : (
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Certified Plant Report</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
