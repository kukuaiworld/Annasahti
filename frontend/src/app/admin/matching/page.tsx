"use client";

import { useState, useEffect } from "react";
import { Cpu, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, MapPin, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { Donation, RecipientRequest } from "@/types";

export default function AdminMatchingPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = () => {
    setDonations(storageService.getDonations());
    setRequests(storageService.getRequests());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("annasathi_storage_update", loadData);
    return () => window.removeEventListener("annasathi_storage_update", loadData);
  }, []);

  const handleTriggerMatch = (donationId: string, code: string) => {
    setNotice(
      `Consignment ${code}: Algorithmic dispatch is managed via backend PostGIS matching service (/api/v1/batches/${donationId}/matches) upon verified human inspection approval.`
    );
    setTimeout(() => setNotice(null), 5000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Smart Matching Engine Directorate Control"
        subtitle="Manage automated surplus-to-demand pairing algorithms and manual dispatch overrides"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-6xl">
        <Breadcrumbs items={[{ label: "Admin Portal", href: "/admin/dashboard" }, { label: "Matching Engine" }]} />

        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Engine Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Primary Constraint</span>
            <div className="text-base font-bold text-slate-900 mt-1">GIS Proximity Radius (8km Max)</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Minimizes time in microbial danger zone</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Secondary Constraint</span>
            <div className="text-base font-bold text-slate-900 mt-1">Strict Dietary Alignment</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Vegetarian orphanages never receive meat items</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Tertiary Constraint</span>
            <div className="text-base font-bold text-slate-900 mt-1">Serving Volume Tolerance (±30%)</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Avoids secondary food spoilage at shelter</p>
          </div>
        </div>

        {/* Consignment Queue Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Surplus Consignment Pairing Queue</h3>
            <span className="text-xs text-slate-500">Live AI Routing</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Consignment</th>
                <th className="py-3 px-4">Donor Origin</th>
                <th className="py-3 px-4">Payload</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Assigned Partner</th>
                <th className="py-3 px-4 text-right">Engine Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{d.trackingCode}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{d.donorName}</p>
                    <p className="text-[11px] text-slate-500">{d.location}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {d.totalKg} kg (~{d.estimatedServings} meals)
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={d.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">
                    {d.assignedRecipientName || "Unassigned in Queue"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {d.status === "posted" ? (
                      <button
                        onClick={() => handleTriggerMatch(d.id, d.trackingCode)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] transition shadow-sm inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run Match</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Dispatched</span>
                    )}
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
