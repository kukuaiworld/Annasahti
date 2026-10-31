"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  PlusCircle,
  Truck,
  Leaf,
  Users,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import QRModal from "@/components/shared/QRModal";
import { storageService } from "@/services/storageService";
import { Donation } from "@/types";

export default function DonorDashboardPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [selectedQrDonation, setSelectedQrDonation] = useState<Donation | null>(null);

  const loadData = () => {
    setDonations(storageService.getDonations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("annasathi_storage_update", loadData);
    return () => window.removeEventListener("annasathi_storage_update", loadData);
  }, []);

  const totalKg = donations.reduce((sum, d) => sum + d.totalKg, 0);
  const totalMeals = donations.reduce((sum, d) => sum + d.estimatedServings, 0);
  const totalCo2 = donations.reduce((sum, d) => sum + d.co2SavedKg, 0);

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Commercial Kitchen Operations"
        subtitle="Grand Heritage Banquets & Caterers (North Delhi Hub)"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Donor Portal", href: "/donor/dashboard" }, { label: "Operations Dashboard" }]} />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Surplus Donated</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalKg} kg</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">100% Landfill Diverted</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Meals Served to Children</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalMeals}</div>
              <span className="text-[10px] text-purple-600 font-semibold mt-1 block">Orphanage & Shelters</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">CO₂ Emissions Diverted</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCo2} kg</div>
              <span className="text-[10px] text-teal-600 font-semibold mt-1 block">Scope 3 ESG Credits</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Active Food Consignments</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {donations.filter((d) => d.status === "in_transit" || d.status === "matched").length}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Live Courier Couriers</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Quick Post Prompt Banner */}
        <div className="bg-gradient-to-r from-brand-600 to-emerald-700 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-base sm:text-lg font-bold">Got Surplus Feasts Tonight?</h3>
            <p className="text-xs text-brand-100 mt-0.5">
              An electric courier can arrive at your loading dock within 30 minutes with temperature containers.
            </p>
          </div>
          <Link
            href="/donor/new-donation"
            className="px-5 py-2.5 bg-white text-brand-800 text-xs font-bold rounded-xl hover:bg-brand-50 transition shadow shrink-0 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Surplus Listing</span>
          </Link>
        </div>

        {/* Recent Consignments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Kitchen Donations & Handoffs</h3>
              <p className="text-xs text-slate-500">Live monitoring of your surplus consignments</p>
            </div>
            <Link
              href="/donor/donations"
              className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tracking Code</th>
                  <th className="py-3 px-4">Menu Items</th>
                  <th className="py-3 px-4">Quantity / Meals</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Recipient Match</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {donations.slice(0, 5).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                      {d.trackingCode}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {d.foodItems.map((f) => f.name).join(", ")}
                    </td>
                    <td className="py-3.5 px-4">
                      {d.totalKg} kg <span className="text-slate-400 font-normal">({d.estimatedServings} meals)</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      {d.assignedRecipientName || "Auto-Matching..."}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedQrDonation(d)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-brand-700 rounded-lg transition inline-flex items-center gap-1"
                        title="Display Printable QR Tag"
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="text-[11px] font-semibold">QR Tag</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR Code Inspection Modal */}
      {selectedQrDonation && (
        <QRModal
          isOpen={!!selectedQrDonation}
          onClose={() => setSelectedQrDonation(null)}
          title={`Donation Tag: ${selectedQrDonation.trackingCode}`}
          code={selectedQrDonation.trackingCode}
          details={{
            donor: selectedQrDonation.donorName,
            items: selectedQrDonation.foodItems.map((f) => f.name).join(", "),
            servings: selectedQrDonation.estimatedServings,
            weight: `${selectedQrDonation.totalKg} kg`,
            tier: selectedQrDonation.inspection?.assignedTier,
          }}
        />
      )}
    </div>
  );
}
