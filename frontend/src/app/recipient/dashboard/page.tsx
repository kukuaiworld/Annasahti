"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Truck,
} from "lucide-react";
import RecipientHeader from "@/components/recipient/RecipientHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import QRModal from "@/components/shared/QRModal";
import { storageService } from "@/services/storageService";
import { RecipientRequest, Donation } from "@/types";

export default function RecipientDashboardPage() {
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [incomingDonation, setIncomingDonation] = useState<Donation | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    setRequests(storageService.getRequests());
    // Find the active delivery coming to Asha Kiran
    const don = storageService.getDonations().find((d) => d.id === "don-101");
    if (don) setIncomingDonation(don);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <RecipientHeader
        title="Shelter Kitchen Operations"
        subtitle="Asha Kiran Orphanage & Child Care • Timarpur, Delhi"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Recipient Portal", href: "/recipient/dashboard" }, { label: "Shelter Overview" }]} />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Resident Children</span>
              <div className="text-2xl font-black text-slate-900 mt-1">120</div>
              <span className="text-[10px] text-purple-600 font-semibold mt-1 block">Full daily boarding</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Meals Received (Month)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">3,420</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">100% FSSAI Inspected</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Ration Budget Saved</span>
              <div className="text-2xl font-black text-brand-700 mt-1">₹85,400</div>
              <span className="text-[10px] text-brand-600 font-semibold mt-1 block">Redirected to education</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Dietary Requirement</span>
              <div className="text-lg font-black text-slate-900 mt-1">Strict Veg</div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Zero allergen alerts</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Incoming Delivery Alert Banner */}
        {incomingDonation && (
          <div className="bg-white rounded-3xl border border-purple-300 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-purple-600 animate-ping" />
                <h3 className="font-bold text-slate-900 text-base">Incoming Hot Meal Delivery</h3>
                <StatusBadge status={incomingDonation.status} size="sm" />
              </div>

              <button
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-bold border border-purple-200 transition flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-purple-700" />
                <span>Verify Consignment Tag</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Consignment Code</span>
                <span className="font-mono font-bold text-slate-900">{incomingDonation.trackingCode}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Source Donor</span>
                <span className="font-bold text-slate-900">{incomingDonation.donorName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Payload</span>
                <span className="font-bold text-purple-700">{incomingDonation.totalKg} kg (~{incomingDonation.estimatedServings} servings)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" />
                <span>Assigned Courier: <strong>{incomingDonation.assignedVolunteerName}</strong> is 12 mins away.</span>
              </div>
              <Link href="/food-trace" className="font-bold text-purple-700 underline text-[11px]">
                Trace Live Route →
              </Link>
            </div>
          </div>
        )}

        {/* Requests Status */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Meal Requirement Tickets</h3>
              <p className="text-xs text-slate-500">Track matched donations or post urgent breakfast/dinner requirements</p>
            </div>
            <Link
              href="/recipient/new-request"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </Link>
          </div>

          <div className="space-y-3">
            {requests.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{req.organizationName}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Needs: <strong>{req.requiredServings} servings</strong> ({req.dietaryPreference.replace(/_/g, " ")}) • {req.location}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={req.urgencyLevel} size="sm" />
                  <StatusBadge status={req.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {incomingDonation && (
        <QRModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title={`Incoming Food Tag: ${incomingDonation.trackingCode}`}
          code={incomingDonation.trackingCode}
          details={{
            donor: incomingDonation.donorName,
            items: incomingDonation.foodItems.map((f) => f.name).join(", "),
            servings: incomingDonation.estimatedServings,
            weight: `${incomingDonation.totalKg} kg`,
            tier: incomingDonation.inspection?.assignedTier,
          }}
        />
      )}
    </div>
  );
}
