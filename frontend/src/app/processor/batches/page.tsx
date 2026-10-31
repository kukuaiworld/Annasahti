"use client";

import { useState, useEffect } from "react";
import { Factory, Flame, PlusCircle, CheckCircle2, Clock } from "lucide-react";
import ProcessorHeader from "@/components/processor/ProcessorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { ProcessorBatch } from "@/types";

export default function ProcessorBatchesPage() {
  const [batches, setBatches] = useState<ProcessorBatch[]>([]);

  useEffect(() => {
    setBatches(storageService.getProcessorBatches());
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <ProcessorHeader
        title="Processing Batches & Digester Tanks"
        subtitle="Track incoming feedstock fermentation and output yields"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Processing Partner", href: "/processor/dashboard" }, { label: "Feedstock Batches" }]} />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Industrial Feedstock Batches</h3>
            <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              {batches.length} Active Units
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Facility & Process</th>
                <th className="py-3 px-4">Input Feedstock</th>
                <th className="py-3 px-4">Output Yield</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{b.batchCode}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{b.facilityName}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{b.processType.replace(/_/g, " ")}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{b.inputFeedstockKg} kg</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">
                    {b.outputEnergyKwh ? `${b.outputEnergyKwh} kWh BioCNG` : `${b.outputCompostKg} kg Manure`}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
