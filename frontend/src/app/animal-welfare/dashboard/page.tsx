"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PawPrint,
  CheckCircle2,
  Leaf,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import AnimalWelfareHeader from "@/components/animal-welfare/AnimalWelfareHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { storageService } from "@/services/storageService";
import { AnimalFeedLog } from "@/types";

export default function AnimalWelfareDashboardPage() {
  const [logs, setLogs] = useState<AnimalFeedLog[]>([]);

  useEffect(() => {
    setLogs(storageService.getAnimalLogs());
  }, []);

  const totalKg = logs.reduce((acc, l) => acc + l.quantityKg, 0);

  return (
    <div className="flex-1 flex flex-col">
      <AnimalWelfareHeader
        title="Sanctuary & Feed Operations"
        subtitle="Shri Krishna Gaushala & Animal Sanctuary • Delhi NCR"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Animal Welfare", href: "/animal-welfare/dashboard" }, { label: "Sanctuary Dashboard" }]} />

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Animals Sheltered</span>
              <div className="text-2xl font-black text-slate-900 mt-1">42 Cattle</div>
              <span className="text-[10px] text-amber-600 font-semibold mt-1 block">Plus 28 shelter dogs</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <PawPrint className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Tier-3 Surplus Received</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalKg} kg</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Safe nutritious fodder</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Fodder Budget Savings</span>
              <div className="text-2xl font-black text-brand-700 mt-1">₹42,800</div>
              <span className="text-[10px] text-brand-600 font-semibold mt-1 block">Redirected to vet medicine</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Safety Screening</span>
              <div className="text-lg font-black text-slate-900 mt-1">100% Certified</div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Zero toxic spices / onion</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Diverted Feed Consignment Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Tier-3 Diversion Protocol
            </span>
            <h3 className="text-xl font-bold mt-1">Wholesome Food Beyond Human Dining Window</h3>
            <p className="text-xs text-amber-100 max-w-xl mt-1">
              Surplus banquet produce trimmings, stale wholesome bakery breads, and clean fruit trimmings are diverted
              here, keeping cows and rescue animals nourished.
            </p>
          </div>
          <Link
            href="/animal-welfare/requests"
            className="px-5 py-2.5 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition shadow shrink-0 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Fodder Demand</span>
          </Link>
        </div>

        {/* Recent Animal Feed Batches */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Feed Intake Logs</h3>
              <p className="text-xs text-slate-500">Documented batches delivered to shelter feed troughs</p>
            </div>
            <Link
              href="/animal-welfare/feed-logs"
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>View Full Feed Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-700">{log.feedBatchId}</span>
                    <span className="font-bold text-slate-900 capitalize">({log.animalType})</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.notes}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-amber-700">{log.quantityKg} kg</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[10px]">
                    {log.safetyCheck.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
