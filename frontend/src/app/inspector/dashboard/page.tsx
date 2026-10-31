"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  ArrowRight,
  RefreshCw,
  Scale,
  MapPin,
  Calendar,
  Layers,
} from "lucide-react";
import { inspectionsApi } from "@/services/api/inspections";
import { InspectionQueueItem } from "@/types/inspections";
import { useAuth } from "@/providers/auth-provider";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

export default function InspectorDashboardPage() {
  const { profile } = useAuth();
  const [queueItems, setQueueItems] = useState<InspectionQueueItem[]>([]);
  const [totalInQueue, setTotalInQueue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch queue items with limit 20 to compute queue metrics
      const response = await inspectionsApi.getInspectionQueue({ page: 1, limit: 20 });
      setQueueItems(response.data || []);
      setTotalInQueue(response.meta?.total || 0);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load inspection queue data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics from verified backend queue
  const pendingCount = queueItems.filter((b) => b.status === "pending_inspection").length;
  const holdCount = queueItems.filter((b) => b.status === "hold").length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              Human Inspection Authority
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            Quality Inspection Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, <strong className="text-slate-800">{profile?.fullName || "Inspector"}</strong>. Physical sensory evaluation is required for every food rescue consignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
          <Link
            href="/inspector/queue"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Open Queue</span>
          </Link>
        </div>
      </div>

      {/* Safety Invariant Notice */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-slate-900 text-sm">Mandatory Food Safety Verification Standard</p>
          <p>
            All posted food batches remain on <strong>PENDING_INSPECTION</strong> or <strong>HOLD</strong> until you record human sensory observations (temperature, packaging integrity, visual hygiene, odour).
            Food suitable for animal feeding requires a species-specific determination and must never use spoiled or expired human rations.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total In Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <span className="text-slate-300">--</span> : totalInQueue}
          </div>
          <p className="text-xs text-slate-500">
            Batches currently awaiting certified evaluation
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending First Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <span className="text-slate-300">--</span> : pendingCount}
          </div>
          <p className="text-xs text-slate-500">
            Newly posted consignments on initial hold
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Safety Hold / Review
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? <span className="text-slate-300">--</span> : holdCount}
          </div>
          <p className="text-xs text-slate-500">
            Consignments marked requires_review
          </p>
        </div>
      </div>

      {/* Queue Preview Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Priority Batches Awaiting Inspection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Earliest posted batches requiring physical sign-off before allocation
            </p>
          </div>
          <Link
            href="/inspector/queue"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
          >
            <span>View Full Queue ({totalInQueue})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : queueItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Inspection Queue Clear</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no food batches pending inspection or on safety hold in your jurisdiction.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queueItems.slice(0, 5).map((batch) => (
              <div
                key={batch.id}
                className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {batch.batch_code}
                    </span>
                    <StatusBadge status={batch.status} size="sm" />
                    {batch.inspection_attempts > 0 && (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {batch.inspection_attempts} attempt{batch.inspection_attempts > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{batch.food_name}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{batch.donor_name}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      <span>{batch.quantity} {batch.quantity_unit}</span>
                    </span>
                    {batch.donor_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-xs">{batch.donor_address}</span>
                      </span>
                    )}
                    {batch.best_before_at && (
                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Best Before: {new Date(batch.best_before_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/inspector/inspections/${batch.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
                  >
                    <span>Inspect Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
