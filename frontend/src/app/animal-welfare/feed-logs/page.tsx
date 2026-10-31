"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, PawPrint, ShieldCheck, CheckCircle2 } from "lucide-react";
import AnimalWelfareHeader from "@/components/animal-welfare/AnimalWelfareHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { storageService } from "@/services/storageService";
import { AnimalFeedLog } from "@/types";

export default function AnimalWelfareFeedLogsPage() {
  const [logs, setLogs] = useState<AnimalFeedLog[]>([]);

  useEffect(() => {
    setLogs(storageService.getAnimalLogs());
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <AnimalWelfareHeader
        title="Tier-3 Animal Feed Historical Ledger"
        subtitle="Complete log of diverted organic surplus accepted and fed to shelter animals"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Animal Welfare", href: "/animal-welfare/dashboard" }, { label: "Tier-3 Feed Logs" }]} />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Feed Delivery Manifests</h3>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {logs.length} Logged Entries
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Consignment ID</th>
                <th className="py-3 px-4">Animal Category</th>
                <th className="py-3 px-4">Payload (kg)</th>
                <th className="py-3 px-4">Safety Certification</th>
                <th className="py-3 px-4">Composition & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{log.feedBatchId}</td>
                  <td className="py-3.5 px-4 capitalize font-semibold text-slate-800">{log.animalType}</td>
                  <td className="py-3.5 px-4 font-black text-amber-700">{log.quantityKg} kg</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{log.safetyCheck.replace(/_/g, " ")}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
