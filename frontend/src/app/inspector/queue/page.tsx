"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Building2,
  Calendar,
  Scale,
  MapPin,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { inspectionsApi } from "@/services/api/inspections";
import { InspectionQueueItem } from "@/types/inspections";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

export default function InspectionQueuePage() {
  const [queueItems, setQueueItems] = useState<InspectionQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 15;

  const fetchQueue = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inspectionsApi.getInspectionQueue({ page: targetPage, limit });
      setQueueItems(response.data || []);
      setPage(response.meta?.page || targetPage);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalCount(response.meta?.total || 0);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load inspection queue");
      }
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchQueue(page);
  }, [fetchQueue, page]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/inspector/dashboard"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Inspector Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">Queue</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">Inspection Queue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              {totalCount} Awaiting
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Certified verification queue for batches currently on <strong className="text-slate-800">pending_inspection</strong> or <strong className="text-slate-800">hold</strong>.
          </p>
        </div>

        <button
          onClick={() => fetchQueue(page)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchQueue(page)}
            className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Queue Listing */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : queueItems.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No Batches in Inspection Queue</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All donated food consignments have been inspected or no batches require evaluation at this moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queueItems.map((batch) => {
              const isHold = batch.status === "hold";
              return (
                <div
                  key={batch.id}
                  className={`p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isHold ? "bg-orange-50/30 hover:bg-orange-50/50" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {batch.batch_code}
                      </span>
                      <StatusBadge status={batch.status} size="sm" />
                      {batch.inspection_attempts > 0 && (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {batch.inspection_attempts} prior inspection{batch.inspection_attempts > 1 ? "s" : ""}
                        </span>
                      )}
                      {isHold && (
                        <span className="text-[11px] font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                          Action Required: Under Safety Review
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {batch.food_name}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{batch.donor_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{batch.quantity} {batch.quantity_unit}</span>
                      </div>
                      {batch.best_before_at && (
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Best Before: {new Date(batch.best_before_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {batch.pickup_deadline && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Pickup By: {new Date(batch.pickup_deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>

                    {batch.donor_address && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{batch.donor_address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
                    <Link
                      href={`/inspector/inspections/${batch.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition w-full sm:w-auto"
                    >
                      <span>Perform Inspection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} items)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
