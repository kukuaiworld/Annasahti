"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  CheckCircle2,
  Ban,
  Clock,
  Building2,
  Scale,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from "lucide-react";
import { allocationsApi } from "@/services/api/allocations";
import { AllocationStatus, FoodAllocationRecord } from "@/types/allocations";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

export default function RecipientAllocationsPage() {
  const [allocations, setAllocations] = useState<FoodAllocationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Action states
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [rejectingAllocation, setRejectingAllocation] = useState<FoodAllocationRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
        setError(err.message || "Failed to load incoming allocations");
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const handleAccept = async (alloc: FoodAllocationRecord) => {
    setActionError(null);
    setActionSuccess(null);
    setSubmittingAction(true);
    try {
      await allocationsApi.acceptAllocation(alloc.id);
      setActionSuccess(
        `Allocation offer of ${alloc.allocated_quantity} ${alloc.quantity_unit} for "${alloc.food_name}" successfully accepted. Delivery assignment is now in progress.`
      );
      await fetchAllocations();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setActionError(`Acceptance Failed (${err.statusCode}): ${err.message}`);
      } else {
        setActionError(err.message || "Failed to accept allocation offer");
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenRejectModal = (alloc: FoodAllocationRecord) => {
    setRejectingAllocation(alloc);
    setRejectReason("");
    setActionError(null);
  };

  const handleCloseRejectModal = () => {
    setRejectingAllocation(null);
    setRejectReason("");
    setActionError(null);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAllocation || !rejectReason.trim()) {
      setActionError("A rejection reason is required for the audit trail.");
      return;
    }

    setSubmittingAction(true);
    setActionError(null);
    try {
      await allocationsApi.rejectAllocation(rejectingAllocation.id, rejectReason.trim());
      setActionSuccess(
        `Allocation offer declined. Reserved food inventory has been automatically released back to the donor.`
      );
      handleCloseRejectModal();
      await fetchAllocations();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setActionError(`Decline Failed (${err.statusCode}): ${err.message}`);
      } else {
        setActionError(err.message || "Failed to decline allocation offer");
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Recipient Care Management
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">Incoming Food Allocation Offers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Review, accept or decline food donations matched to your shelter&apos;s registered dietary needs and storage capacity.
          </p>
        </div>

        <button
          onClick={fetchAllocations}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Action Messages */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-start gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : allocations.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Allocation Offers Available</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You currently have no incoming food offers. FoodLoop continuously monitors nearby donor listings matching your accepted categories.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allocations.map((alloc) => {
              const isPending = alloc.status === "pending";
              return (
                <div
                  key={alloc.id}
                  className={`p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPending ? "bg-purple-50/30 hover:bg-purple-50/50" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {alloc.batch_code || "BATCH"}
                      </span>
                      <StatusBadge status={alloc.status} size="sm" />
                      {isPending && (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                          Awaiting Your Acceptance
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {alloc.food_name || "Food Consignment"}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Donor: <strong>{alloc.donor_name || "Food Donor"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Offered: <strong>{alloc.allocated_quantity} {alloc.quantity_unit}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Offered: {new Date(alloc.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    <Link
                      href={`/allocations/${alloc.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                    >
                      <span>Inspect Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() => handleAccept(alloc)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Offer</span>
                        </button>

                        <button
                          type="button"
                          disabled={submittingAction}
                          onClick={() => handleOpenRejectModal(alloc)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
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

      {/* REJECT MODAL */}
      {rejectingAllocation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={handleCloseRejectModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
                <Ban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Decline Allocation Offer
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Decline <strong>{rejectingAllocation.allocated_quantity} {rejectingAllocation.quantity_unit}</strong> of {rejectingAllocation.food_name}.
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify why this donation cannot be received (e.g. storage full, dietary mismatch, kitchen currently at capacity)..."
                  rows={3}
                  maxLength={500}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseRejectModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Keep Offer
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{submittingAction ? "Declining..." : "Confirm Decline"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
