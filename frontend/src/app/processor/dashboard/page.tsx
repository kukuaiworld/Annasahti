"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Factory,
  Flame,
  Leaf,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import ProcessorHeader from "@/components/processor/ProcessorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { ProcessorBatch } from "@/types";

export default function ProcessorDashboardPage() {
  const [batches, setBatches] = useState<ProcessorBatch[]>([]);

  useEffect(() => {
    setBatches(storageService.getProcessorBatches());
  }, []);

  const totalInputKg = batches.reduce((acc, b) => acc + b.inputFeedstockKg, 0);

  return (
    <div className="flex-1 flex flex-col">
      <ProcessorHeader
        title="Bio-Energy Digestion & Compost Control"
        subtitle="Delhi Urja BioCNG & Clean Energy Plant • Industrial Cluster"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Processing Partner", href: "/processor/dashboard" }, { label: "Plant Overview" }]} />

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Decomposed Waste Diverted</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalInputKg} kg</div>
              <span className="text-[10px] text-teal-600 font-semibold mt-1 block">Tier-4 Industrial Feedstock</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Factory className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Clean Energy Generated</span>
              <div className="text-2xl font-black text-amber-600 mt-1">68.4 kWh</div>
              <span className="text-[10px] text-amber-700 font-semibold mt-1 block">BioCNG for city vehicles</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Organic Vermicompost</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">680 kg</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Farmer soil nutrient cure</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Landfill Methane Abated</span>
              <div className="text-lg font-black text-slate-900 mt-1">100% Zero Landfill</div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Circular bio-economy</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Active Digester Batches */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Biogas & Composting Digesters</h3>
              <p className="text-xs text-slate-500">Live monitoring of anaerobic retention periods and temperature curves</p>
            </div>
            <Link
              href="/processor/batches"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              <span>Manage Batches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800">{batch.batchCode}</span>
                    <span className="font-bold text-slate-900">{batch.facilityName}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Process: <strong className="capitalize">{batch.processType.replace(/_/g, " ")}</strong> • Input: {batch.inputFeedstockKg} kg
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">
                    {batch.outputEnergyKwh ? `${batch.outputEnergyKwh} kWh clean gas` : `${batch.outputCompostKg} kg manure`}
                  </span>
                  <StatusBadge status={batch.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
