"use client";

import { Flame, Leaf, Zap, RefreshCw } from "lucide-react";
import ProcessorHeader from "@/components/processor/ProcessorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ProcessorCompostBiofuelPage() {
  return (
    <div className="flex-1 flex flex-col">
      <ProcessorHeader
        title="Clean BioCNG & Organic Compost Generation Units"
        subtitle="Industrial anaerobic digestion telemetry, gas scrubbers and vermicompost curing"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Processing Partner", href: "/processor/dashboard" }, { label: "BioCNG & Compost" }]} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* BioCNG Unit */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">BioCNG Methane Generation Unit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Captures clean bio-methane through continuous anaerobic digestion of kitchen slops. Scrubbed to 96% purity
              for vehicle compression.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tank Pressure:</span>
                <span className="font-bold text-slate-900">2.4 Bar (Optimal)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Methane Purity:</span>
                <span className="font-bold text-emerald-700">96.2% CH₄</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Output:</span>
                <span className="font-black text-amber-600">68.4 kWh Clean Power</span>
              </div>
            </div>
          </div>

          {/* Vermicompost Unit */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Organic Vermicompost Curing Bed</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fibrous solid digestate is cured with red earthworms (Eisenia fetida) to generate high-nitrogen organic manure
              distributed to peri-urban farmers.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Digestate Beds:</span>
                <span className="font-bold text-slate-900">6 Active Windrows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Moisture Content:</span>
                <span className="font-bold text-teal-700">55% (Curing)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Fertilizer:</span>
                <span className="font-black text-emerald-700">680 kg High-NPK Manure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
