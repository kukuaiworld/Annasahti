"use client";

import { useState, useEffect } from "react";
import {
  Search,
  QrCode,
  ShieldCheck,
  Truck,
  MapPin,
  Clock,
  Thermometer,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import QRModal from "@/components/shared/QRModal";
import { storageService } from "@/services/storageService";
import { Donation } from "@/types";

export default function FoodTracePage() {
  const [searchQuery, setSearchQuery] = useState("AS-2026-8941");
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const performSearch = (code: string) => {
    setErrorMsg(null);
    const result = storageService.getDonationByCode(code);
    if (result) {
      setActiveDonation(result);
    } else {
      setActiveDonation(null);
      setErrorMsg(`No consignment found with tracking ID "${code}". Try AS-2026-8941 or AS-2026-8944.`);
    }
  };

  useEffect(() => {
    performSearch(searchQuery);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "FoodTrace Verification" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Cryptographic Cold-Chain Verification
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          FoodTrace™ Public Tracking & Safety Ledger
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Verify any surplus food batch by its unique QR code or consignment code. Transparently audit
          kitchen origin, digital temperature readings, FSSAI digital signatures, and route milestones.
        </p>
      </div>

      {/* Search Bar & Sample Code Buttons */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm mb-12">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Consignment Code (e.g. AS-2026-8941)"
              className="w-full pl-12 pr-4 py-3 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase"
            />
          </div>
          <button
            type="submit"
            className="btn-interactive btn-primary px-6 py-3 text-sm font-bold gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track Consignment</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Quick Samples:</span>
          {["AS-2026-8941", "AS-2026-8942", "AS-2026-8944", "AS-2026-8945"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setSearchQuery(code);
                performSearch(code);
              }}
              className="btn-interactive btn-outline px-2.5 py-1 font-mono text-[11px] font-semibold"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-3 mb-10">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Result - Complete Trace Audit Trail */}
      {activeDonation && (
        <div className="space-y-8 animate-fade-in">
          {/* Top Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900">{activeDonation.trackingCode}</h2>
                  <StatusBadge status={activeDonation.status} size="md" />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Rescued from <strong>{activeDonation.donorName}</strong> ({activeDonation.location})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-800 hover:bg-brand-100 rounded-xl text-xs font-bold border border-brand-200 transition"
                >
                  <QrCode className="w-4 h-4 text-brand-700" />
                  <span>Show QR Tag</span>
                </button>
                <div className="text-right pl-4 border-l border-slate-200">
                  <div className="text-xl font-black text-brand-700">{activeDonation.totalKg} kg</div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ~{activeDonation.estimatedServings} servings
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Recipient</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                  {activeDonation.assignedRecipientName || "Auto-Dispatch Queue"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Volunteer Courier</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                  {activeDonation.assignedVolunteerName || "Pending Courier"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CO₂ Diverted</span>
                <span className="font-bold text-emerald-700 mt-0.5 block">
                  {activeDonation.co2SavedKg} kg CO₂e
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Water Conserved</span>
                <span className="font-bold text-blue-700 mt-0.5 block">
                  {activeDonation.waterSavedLitres.toLocaleString()} Litres
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 8 Cols: Verification Journey */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-6">Custody & Safety Audit Trail</h3>

              <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
                {/* Milestone 1: Posted */}
                <div className="relative flex items-start gap-5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 ring-4 ring-white z-10">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">Commercial Kitchen Dispatch Recorded</span>
                      <span className="text-slate-400">02:00 AM (Prep Log)</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Dishes: {activeDonation.foodItems.map((f) => `${f.name} (${f.quantityKg}kg)`).join(", ")}.
                      Sealed in food-grade insulated containers.
                    </p>
                  </div>
                </div>

                {/* Milestone 2: Inspection */}
                <div className="relative flex items-start gap-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-4 ring-white z-10 ${
                    activeDonation.inspection ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">On-Site FSSAI Quality Inspection</span>
                      <span className="text-slate-400">
                        {activeDonation.inspection ? activeDonation.inspection.inspectionDate.slice(11, 16) + " UTC" : "Pending"}
                      </span>
                    </div>

                    {activeDonation.inspection ? (
                      <div className="text-xs space-y-1.5 mt-2">
                        <div className="flex items-center gap-4 text-slate-700 font-medium">
                          <span>Temp: <strong>{activeDonation.inspection.storageTempCelsius}°C</strong></span>
                          <span>Visual: {activeDonation.inspection.visualCheckPassed ? "✓ Passed" : "✗ Flagged"}</span>
                          <span>Smell: {activeDonation.inspection.smellCheckPassed ? "✓ Passed" : "✗ Flagged"}</span>
                        </div>
                        <p className="text-slate-600 italic text-[11px] bg-white p-2 rounded border border-slate-200">
                          &ldquo;{activeDonation.inspection.notes}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-teal-800 font-mono pt-1">
                          <span>Inspector: {activeDonation.inspection.inspectorName}</span>
                          <span>Signature: {activeDonation.inspection.digitalSignature}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic mt-1">
                        Awaiting courier arrival with digital infrared probe for physical verification.
                      </p>
                    )}
                  </div>
                </div>

                {/* Milestone 3: Transit */}
                <div className="relative flex items-start gap-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-4 ring-white z-10 ${
                    activeDonation.status === "in_transit" || activeDonation.status === "delivered"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">Cold-Chain Insulated Transit</span>
                      <span className="text-slate-400">
                        {activeDonation.status === "in_transit" ? "In Progress" : "Completed"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Transported via zero-emission electric cargo vehicle equipped with insulated thermoware
                      containment to maintain hygienic core temperatures.
                    </p>
                  </div>
                </div>

                {/* Milestone 4: Shelter Handshake */}
                <div className="relative flex items-start gap-5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-4 ring-white z-10 ${
                    activeDonation.status === "delivered" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">Recipient Receipt & QR Verification</span>
                      <span className="text-slate-400">
                        {activeDonation.status === "delivered" ? "Confirmed" : "Awaiting Dropoff"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Scanned by {activeDonation.assignedRecipientName || "Authorized Shelter Trustee"}.
                      Meals prepared for immediate distribution in children dining hall.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Certificate & QR Stamp */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gradient-to-br from-brand-900 to-slate-900 text-white rounded-3xl p-6 shadow-lg text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Cryptographic Trust Stamp
                </span>
                <h4 className="text-lg font-black mt-1 mb-4">{activeDonation.trackingCode}</h4>

                <div className="bg-white p-3 rounded-2xl inline-block mx-auto mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      activeDonation.trackingCode
                    )}&color=052e16`}
                    alt={`QR Code ${activeDonation.trackingCode}`}
                    className="w-36 h-36 rounded-lg"
                  />
                </div>

                <p className="text-xs text-slate-300 mb-4">
                  Scan on mobile to verify origin without logging into AnnaSathi.
                </p>

                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print FSSAI Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for inspection */}
      {activeDonation && (
        <QRModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title={`FoodTrace: ${activeDonation.trackingCode}`}
          code={activeDonation.trackingCode}
          details={{
            donor: activeDonation.donorName,
            items: activeDonation.foodItems.map((f) => f.name).join(", "),
            servings: activeDonation.estimatedServings,
            weight: `${activeDonation.totalKg} kg`,
            tier: activeDonation.inspection?.assignedTier,
          }}
        />
      )}
    </div>
  );
}
