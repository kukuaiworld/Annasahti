"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Ban,
  Clock,
  Building2,
  Scale,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { allocationsApi } from "@/services/api/allocations";
import { AllocationStatus, FoodAllocationRecord } from "@/types/allocations";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

const STATUS_FILTERS = [
  { label: "All Allocations", value: "" },
  { label: "Pending Offer", value: AllocationStatus.PENDING },
  { label: "Accepted by Recipient", value: AllocationStatus.ACCEPTED },
  { label: "Partially Fulfilled", value: AllocationStatus.PARTIALLY_FULFILLED },
  { label: "Fulfilled / Delivered", value: AllocationStatus.FULFILLED },
  { label: "Cancelled", value: AllocationStatus.CANCELLED },
];

export default function DonorAllocationsPage() {
  const [allocations, setAllocations] = useState<FoodAllocationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Cancellation Modal State
  const [cancellingAllocation, setCancellingAllocation] = useState<FoodAllocationRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [submittingCancel, setSubmittingCancel] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationsApi.listAllocations({
        page,
        limit: 15,
        status: statusFilter || undefined,
      });
      setAllocations(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalCount(response.meta?.total || 0);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load allocation records");
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const handleOpenCancelModal = (alloc: FoodAllocationRecord) => {
    setCancellingAllocation(alloc);
    setCancelReason("");
    setCancelError(null);
  };

  const handleCloseCancelModal = () => {
    setCancellingAllocation(null);
    setCancelReason("");
    setCancelError(null);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAllocation || !cancelReason.trim()) {
      setCancelError("An explicit cancellation reason is required.");
      return;
    }

    setSubmittingCancel(true);
    setCancelError(null);
    try {
      await allocationsApi.cancelAllocation(cancellingAllocation.id, cancelReason.trim());
      handleCloseCancelModal();
      await fetchAllocations();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setCancelError(`Cancellation Failed (${err.statusCode}): ${err.message}`);
      } else {
        setCancelError(err.message || "Failed to cancel allocation");
      }
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Inventory Reservation
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">Food Allocations Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-800 border border-brand-200">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Track reserved food consignments dispatched to verified recipient charities and shelter partners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/donor/donations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition"
          >
            <span>View Food Batches</span>
          </Link>
          <button
            onClick={fetchAllocations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
              statusFilter === tab.value
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAllocations}
            className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Allocations Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : allocations.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Allocation Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no allocations matching your filter criteria. Go to your donation ledger to find recipient matches for approved surplus consignments.
            </p>
            <div className="pt-2">
              <Link
                href="/donor/donations"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
              >
                <span>Browse Approved Batches</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allocations.map((alloc) => {
              const isTerminal = ["fulfilled", "cancelled", "expired"].includes(alloc.status);
              return (
                <div
                  key={alloc.id}
                  className="p-5 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {alloc.batch_code || "BATCH"}
                      </span>
                      <StatusBadge status={alloc.status} size="sm" />
                      <span className="text-[11px] text-slate-400 font-mono">
                        Allocation ID: {alloc.id.substring(0, 8)}...
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {alloc.food_name || "Food Consignment"}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Recipient: <strong>{alloc.recipient_name || "Recipient Organisation"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Reserved: <strong>{alloc.allocated_quantity} {alloc.quantity_unit}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Created: {new Date(alloc.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    <Link
                      href={`/allocations/${alloc.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {!isTerminal && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(alloc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel Offer</span>
                      </button>
                    )}
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
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
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

      {/* CANCELLATION MODAL */}
      {cancellingAllocation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={handleCloseCancelModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
                <Ban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Cancel Allocation Reservation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Release <strong>{cancellingAllocation.allocated_quantity} {cancellingAllocation.quantity_unit}</strong> back to batch balance.
              </p>
            </div>

            {cancelError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Specify why this allocation offer is being cancelled (e.g. food expired before delivery, recipient uncontactable, donor kitchen closed)..."
                  rows={3}
                  maxLength={500}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Keep Allocation
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{submittingCancel ? "Cancelling..." : "Confirm Cancellation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
