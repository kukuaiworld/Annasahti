"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Droplets, FlaskConical } from "lucide-react";
import ProcessorHeader from "@/components/processor/ProcessorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ProcessorQAInspectionPage() {
  const [ph, setPh] = useState(5.4);
  const [moisture, setMoisture] = useState(72);
  const [inorganicContaminants, setInorganicContaminants] = useState("0% (Plastic-free)");
  const [verified, setVerified] = useState(false);

  const handleTest = (e: React.FormEvent) => {
    e.preventDefault();
    setVerified(true);
    setTimeout(() => setVerified(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <ProcessorHeader
        title="Inbound Feedstock QA & Digester Health"
        subtitle="Monitor slurry moisture, organic purity and anaerobic digester acidity (pH)"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-3xl">
        <Breadcrumbs items={[{ label: "Processing Partner", href: "/processor/dashboard" }, { label: "Inbound QA" }]} />

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {verified && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Inbound batch certified for anaerobic biodigester tank injection!</span>
            </div>
          )}

          <form onSubmit={handleTest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slurry Acidity Level (pH Meter Reading)
              </label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="9"
                value={ph}
                onChange={(e) => setPh(Number(e.target.value))}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Optimal methanogenic bacteria range: 6.8 to 7.4 (Buffer agent added automatically if &lt; 6.0)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Moisture Ratio (%)</label>
                <input
                  type="number"
                  min="40"
                  max="95"
                  value={moisture}
                  onChange={(e) => setMoisture(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inorganic Contaminants</label>
                <input
                  type="text"
                  value={inorganicContaminants}
                  onChange={(e) => setInorganicContaminants(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Record Digester Slurry Test</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
