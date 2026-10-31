"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Search,
  Filter,
  QrCode,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  FileText,
} from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import QRModal from "@/components/shared/QRModal";
import { storageService } from "@/services/storageService";
import { Donation } from "@/types";

export default function DonorDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQrDonation, setSelectedQrDonation] = useState<Donation | null>(null);

  const loadData = () => {
    setDonations(storageService.getDonations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("annasathi_storage_update", loadData);
    return () => window.removeEventListener("annasathi_storage_update", loadData);
  }, []);

  const filtered = donations.filter((d) => {
    const matchesStatus = filterStatus === "all" || d.status === filterStatus;
    const matchesSearch =
      d.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.foodItems.some((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.assignedRecipientName && d.assignedRecipientName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Donation Ledger & Consignments"
        subtitle="Complete record of all surplus food handoffs and delivery statuses"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Donor Portal", href: "/donor/dashboard" }, { label: "Donation Ledger" }]} />

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search code, dish, or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold w-full sm:w-auto">
            {["all", "posted", "matched", "in_transit", "delivered", "diverted"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  filterStatus === st
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Donation Records */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              No donation records match your filter criteria.
            </div>
          ) : (
            filtered.map((donation) => (
              <div
                key={donation.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {donation.trackingCode}
                    </span>
                    <StatusBadge status={donation.status} size="sm" />
                    <span className="text-[11px] text-slate-400 font-medium">
                      Pickup Window: {donation.pickupWindow.start} - {donation.pickupWindow.end}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedQrDonation(donation)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Print QR Tag</span>
                    </button>

                    <Link
                      href="/food-trace"
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Trace Batch</span>
                    </Link>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-6 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Dishes & Quantities</span>
                    <div className="space-y-1">
                      {donation.foodItems.map((item) => (
                        <div key={item.id} className="flex justify-between font-semibold text-slate-800">
                          <span>{item.name}</span>
                          <span className="text-slate-500">
                            {item.quantityKg} kg (~{item.servings} servings)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-1 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Recipient & Logistics</span>
                    <p className="font-semibold text-slate-800">
                      {donation.assignedRecipientName || "Awaiting Match Dispatch"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Courier: {donation.assignedVolunteerName || "Pending Carrier"}
                    </p>
                  </div>

                  <div className="md:col-span-3 space-y-1 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Environmental Savings</span>
                    <p className="text-emerald-700 font-bold">{donation.co2SavedKg} kg CO₂e offset</p>
                    <p className="text-blue-700 font-semibold">{donation.waterSavedLitres.toLocaleString()} L water</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Modal */}
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
