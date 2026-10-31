"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, PlusCircle, Clock, MapPin, CheckCircle2, ShieldCheck } from "lucide-react";
import RecipientHeader from "@/components/recipient/RecipientHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { RecipientRequest } from "@/types";

export default function RecipientRequestsPage() {
  const [requests, setRequests] = useState<RecipientRequest[]>([]);

  useEffect(() => {
    setRequests(storageService.getRequests());
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <RecipientHeader
        title="Meal Requirement Roster"
        subtitle="Manage active shelter food requests and review algorithmic match statuses"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Recipient Portal", href: "/recipient/dashboard" }, { label: "Meal Demands" }]} />

        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Open & Fulfilled Requests ({requests.length})
          </span>
          <Link
            href="/recipient/new-request"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post New Food Requirement</span>
          </Link>
        </div>

        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{req.organizationName}</h3>
                    <span className="text-[10px] text-slate-400 capitalize">({req.organizationType.replace(/_/g, " ")})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{req.location}</p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={req.urgencyLevel} size="sm" />
                  <StatusBadge status={req.status} size="sm" />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4 pt-1">
                <div>
                  Required: <strong>{req.requiredServings} servings</strong>
                </div>
                <div>
                  Diet Preference: <strong className="capitalize">{req.dietaryPreference.replace(/_/g, " ")}</strong>
                </div>
                <div>
                  Matched Consignment: <strong className="text-purple-700">{req.matchedDonationId || "Pending AI Algorithm Match"}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
