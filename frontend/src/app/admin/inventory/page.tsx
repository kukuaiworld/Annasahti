"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Search, QrCode, ExternalLink } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import QRModal from "@/components/shared/QRModal";
import { storageService } from "@/services/storageService";
import { Donation } from "@/types";

export default function AdminInventoryPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQrDonation, setSelectedQrDonation] = useState<Donation | null>(null);

  useEffect(() => {
    setDonations(storageService.getDonations());
  }, []);

  const filtered = donations.filter(
    (d) =>
      d.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.assignedRecipientName && d.assignedRecipientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="National Consignment Inventory & Live Batches"
        subtitle="Universal tracking ledger across all partner cities and redistribution channels"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Admin Portal", href: "/admin/dashboard" }, { label: "Consignment Inventory" }]} />

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search code, kitchen or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filtered.length} of {donations.length} Active Batches
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Origin Kitchen</th>
                <th className="py-3 px-4">Payload</th>
                <th className="py-3 px-4">Target Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{d.trackingCode}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{d.donorName}</td>
                  <td className="py-3.5 px-4">
                    {d.totalKg} kg <span className="text-slate-400 font-normal">({d.estimatedServings} meals)</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{d.assignedRecipientName || "Auto-Dispatch Queue"}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={d.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedQrDonation(d)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition inline-flex items-center gap-1 font-semibold"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Tag</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedQrDonation && (
        <QRModal
          isOpen={!!selectedQrDonation}
          onClose={() => setSelectedQrDonation(null)}
          title={`Inventory Tag: ${selectedQrDonation.trackingCode}`}
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
