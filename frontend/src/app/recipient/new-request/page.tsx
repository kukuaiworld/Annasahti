"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, CheckCircle2, ShieldCheck, HeartHandshake, AlertTriangle } from "lucide-react";
import RecipientHeader from "@/components/recipient/RecipientHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { storageService } from "@/services/storageService";
import { RecipientRequest } from "@/types";

export default function NewRecipientRequestPage() {
  const router = useRouter();
  const [servings, setServings] = useState(120);
  const [urgency, setUrgency] = useState<"critical" | "high" | "moderate">("high");
  const [dietary, setDietary] = useState<"veg_only" | "all">("veg_only");
  const [notes, setNotes] = useState("Daily lunch requirement for 120 children. Hot cooked dal, rice, or roti sabzi preferred.");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newReq: RecipientRequest = {
      id: "rec-req-" + Date.now(),
      recipientId: "rec-301",
      organizationName: "Asha Kiran Orphanage & Child Care",
      organizationType: "orphanage",
      requiredServings: Number(servings),
      urgencyLevel: urgency,
      dietaryPreference: dietary,
      location: "Burari Road, Timarpur, Delhi",
      distanceKm: 4.2,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    storageService.addRequest(newReq);
    setSubmitted(true);

    setTimeout(() => {
      router.push("/recipient/requests");
    }, 1800);
  };

  return (
    <div className="flex-1 flex flex-col">
      <RecipientHeader
        title="Post Urgent Food Requirement Ticket"
        subtitle="Broadcast your shelter headcount to nearby commercial kitchens and banquets"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-2xl">
        <Breadcrumbs items={[{ label: "Recipient Portal", href: "/recipient/dashboard" }, { label: "Request Food Help" }]} />

        {submitted ? (
          <div className="bg-white p-8 rounded-3xl border border-emerald-300 shadow-sm text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Food Requirement Broadcasted!</h3>
            <p className="text-xs text-slate-600">
              The allocation network is scanning verified donor kitchens within your radius.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Meal Servings
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Based on your registered 120 residential children headcount
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Priority</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="critical">Critical (Required within 2 hours)</option>
                    <option value="high">High (Required for upcoming meal)</option>
                    <option value="moderate">Moderate (Flexible within 6 hours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Restriction</label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="veg_only">Strict Vegetarian Only</option>
                    <option value="all">All Foods Accepted (Veg + Non-Veg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Kitchen Notes / Meal Times
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  All incoming consignments are accompanied by an infrared temperature inspection and FSSAI digital tag.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Broadcast Requirement Ticket</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
