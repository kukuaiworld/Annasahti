"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Scale,
  MapPin,
  Clock,
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  Ban,
  ShieldCheck,
  RefreshCw,
  Info,
  Sliders,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { matchingApi } from "@/services/api/matching";
import { allocationsApi } from "@/services/api/allocations";
import { BatchMatchesResponse, MatchResult } from "@/types/matching";
import { FoodCategory } from "@/types/batches";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

export default function BatchMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  const [data, setData] = useState<BatchMatchesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(25);

  // Allocation Modal State
  const [selectedRecipient, setSelectedRecipient] = useState<MatchResult | null>(null);
  const [allocateQty, setAllocateQty] = useState<string>("");
  const [submittingAllocation, setSubmittingAllocation] = useState<boolean>(false);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [allocationSuccess, setAllocationSuccess] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await matchingApi.findMatchesForBatch(batchId, {
        maxDistanceKm,
        limit: 20,
      });
      setData(response);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load matching recipient recommendations");
      }
    } finally {
      setLoading(false);
    }
  }, [batchId, maxDistanceKm]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleOpenAllocationModal = (recipient: MatchResult) => {
    if (!recipient.isEligible) return;
    setSelectedRecipient(recipient);
    setAllocationError(null);
    setAllocationSuccess(null);
    // Pre-populate with recipient's requested quantity if within balance, else total available
    const defaultQty =
      recipient.recipientRequestedQuantity > 0 &&
      recipient.recipientRequestedQuantity <= recipient.batchAvailableQuantity
        ? recipient.recipientRequestedQuantity
        : recipient.batchAvailableQuantity;
    setAllocateQty(String(defaultQty));
  };

  const handleCloseAllocationModal = () => {
    setSelectedRecipient(null);
    setAllocationError(null);
    setAllocationSuccess(null);
  };

  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !data) return;

    setAllocationError(null);
    setAllocationSuccess(null);

    const qty = parseFloat(allocateQty);
    if (isNaN(qty) || qty <= 0) {
      setAllocationError("Allocation quantity must be a positive number greater than zero.");
      return;
    }

    if (qty > selectedRecipient.batchAvailableQuantity) {
      setAllocationError(
        `Quantity (${qty} ${selectedRecipient.quantityUnit}) exceeds available batch balance (${selectedRecipient.batchAvailableQuantity} ${selectedRecipient.quantityUnit}).`
      );
      return;
    }

    setSubmittingAllocation(true);
    try {
      const result = await allocationsApi.createAllocation({
        batchId: data.batch.id,
        recipientOrganisationId: selectedRecipient.recipientOrganisationId,
        allocatedQuantity: qty,
        quantityUnit: data.batch.quantityUnit, // Exact unit preserved
      });

      setAllocationSuccess(
        `Allocation of ${result.allocation.allocated_quantity} ${result.allocation.quantity_unit} reserved for "${selectedRecipient.recipientName}". Linked delivery task initialized in status "${result.deliveryTask.status}".`
      );

      // Re-fetch batch and matches after successful allocation
      await fetchMatches();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setAllocationError(`Backend Allocation Rejection (${err.statusCode}): ${err.message}`);
      } else {
        setAllocationError(err.message || "Failed to create allocation reservation");
      }
    } finally {
      setSubmittingAllocation(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Match Batch</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <div className="pt-2">
          <Link
            href="/donor/donations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Donation Ledger</span>
          </Link>
        </div>
      </div>
    );
  }

  const { batch, matches } = data!;
  const eligibleMatches = matches.filter((m) => m.isEligible);
  const ineligibleMatches = matches.filter((m) => !m.isEligible);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Breadcrumb & Actions */}
      <div className="space-y-2">
        <Link
          href="/donor/donations"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Donation Ledger</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-brand-800 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                {batch.batchCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 capitalize">
                Category: {batch.category.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
              Recipient Matching & Allocation
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/donor/allocations"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-brand-600" />
              <span>View Active Allocations</span>
            </Link>
            <button
              onClick={fetchMatches}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Matches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Batch Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{batch.foodName}</h2>
            <p className="text-xs text-slate-500">Listed by {batch.donorName}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Remaining Available
            </span>
            <span className="text-lg font-extrabold text-emerald-600">
              {batch.availableQuantity} {batch.quantityUnit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Food Safety Verified:</strong> Passed certified inspection
            </span>
          </div>
          {batch.pickupDeadline && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Pickup By:</strong> {new Date(batch.pickupDeadline).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>Spatial Engine:</strong> PostGIS spatial proximity ranking
            </span>
          </div>
        </div>
      </div>

      {/* Matching Filter Controls */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-slate-700">Search Radius Filter:</span>
          <div className="flex items-center gap-1.5">
            {[10, 25, 50, 100].map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() => setMaxDistanceKm(radius)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  maxDistanceKm === radius
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {radius} km
              </button>
            ))}
          </div>
        </div>

        <div className="text-slate-500">
          Showing <strong>{matches.length}</strong> ranked recommendations ({eligibleMatches.length} eligible)
        </div>
      </div>

      {/* Recipient Matches List */}
      {matches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Matching Recipients Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No recipient organisations with active requirements matched this consignment within {maxDistanceKm} km. Try expanding the search radius.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const isEligible = match.isEligible;
            return (
              <div
                key={match.recipientOrganisationId}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition space-y-4 ${
                  isEligible
                    ? "border-slate-200 hover:border-brand-300 ring-1 ring-transparent hover:ring-brand-200"
                    : "border-slate-200 bg-slate-50/50 opacity-90"
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {match.recipientName}
                      </h3>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                        {match.organisationType.replace(/_/g, " ")}
                      </span>
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Eligible for Allocation</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-200">
                          <Ban className="w-3 h-3 text-red-600" />
                          <span>Ineligible</span>
                        </span>
                      )}
                    </div>
                    {match.address && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{match.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Score & Distance */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {match.distanceKm !== null && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Distance
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {match.distanceKm} km
                        </span>
                      </div>
                    )}
                    <div className="text-right pl-3 border-l border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Match Score
                      </span>
                      <span
                        className={`text-sm font-extrabold ${
                          isEligible ? "text-brand-600" : "text-slate-400"
                        }`}
                      >
                        {match.matchScore} / 100
                      </span>
                      <span className="text-[9px] text-slate-400 block">Ranking Indicator</span>
                    </div>
                  </div>
                </div>

                {/* Capacity & Demand Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Batch Available:</span>
                    <strong className="text-slate-800 font-bold">
                      {match.batchAvailableQuantity} {match.quantityUnit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Recipient Demand:</span>
                    <strong className="text-slate-800 font-bold">
                      {match.recipientRequestedQuantity > 0
                        ? `${match.recipientRequestedQuantity} ${match.quantityUnit}`
                        : "Open Demand"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Storage Capacity:</span>
                    <strong className="text-slate-800 font-bold">
                      {match.recipientStorageCapacityKg !== null
                        ? `${match.recipientStorageCapacityKg} kg`
                        : "Unspecified"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-end">
                    {isEligible ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAllocationModal(match)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Allocate to Recipient</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 text-slate-400 cursor-not-allowed"
                        title="Allocation disabled due to eligibility exclusions"
                      >
                        <span>Ineligible for Allocation</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Exclusion Reasons if Ineligible */}
                {!isEligible && match.exclusionReasons.length > 0 && (
                  <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 text-xs text-red-800 space-y-1">
                    <span className="font-bold block flex items-center gap-1 text-red-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>Exclusion Reasons (Backend Policy):</span>
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                      {match.exclusionReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Matching Factors & Warnings */}
                {(match.factors.length > 0 || match.warnings.length > 0) && (
                  <div className="space-y-1 text-xs">
                    {match.factors.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-500">Matching Factors:</span>
                        {match.factors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md"
                          >
                            ✓ {factor}
                          </span>
                        ))}
                      </div>
                    )}
                    {match.warnings.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-700 pt-1">
                        <span className="font-semibold text-amber-800">Operational Notice:</span>
                        {match.warnings.map((warning, idx) => (
                          <span
                            key={idx}
                            className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md"
                          >
                            ⚠ {warning}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ALLOCATION CREATION MODAL */}
      {selectedRecipient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={handleCloseAllocationModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Confirm Food Reservation
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Allocate to {selectedRecipient.recipientName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consignment: <strong>{batch.foodName}</strong> ({batch.batchCode})
              </p>
            </div>

            {allocationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{allocationError}</span>
              </div>
            )}

            {allocationSuccess ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{allocationSuccess}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Link
                    href="/donor/allocations"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition"
                  >
                    View Active Allocations
                  </Link>
                  <button
                    type="button"
                    onClick={handleCloseAllocationModal}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAllocationSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Available Balance:</span>
                    <strong className="text-emerald-700">
                      {selectedRecipient.batchAvailableQuantity} {selectedRecipient.quantityUnit}
                    </strong>
                  </div>
                  {selectedRecipient.recipientRequestedQuantity > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Recipient Demanded Quantity:</span>
                      <strong>
                        {selectedRecipient.recipientRequestedQuantity} {selectedRecipient.quantityUnit}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Preserved Unit:</span>
                    <span className="font-mono font-bold text-slate-800 uppercase">
                      {selectedRecipient.quantityUnit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Allocation Quantity ({selectedRecipient.quantityUnit}) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max={selectedRecipient.batchAvailableQuantity}
                      required
                      value={allocateQty}
                      onChange={(e) => setAllocateQty(e.target.value)}
                      placeholder="e.g. 25"
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setAllocateQty(String(selectedRecipient.batchAvailableQuantity))}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      All ({selectedRecipient.batchAvailableQuantity})
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    The backend verifies balance locks using database-level concurrency control. Over-allocation is strictly prohibited.
                  </p>
                </div>

                <div className="p-3 bg-brand-50/60 border border-brand-200 rounded-xl text-[11px] text-brand-900">
                  <p>
                    <strong>Two-Party Acceptance Workflow:</strong> Creating this allocation locks the inventory and issues an allocation offer to <em>{selectedRecipient.recipientName}</em>. A linked delivery task will be generated for volunteer routing.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseAllocationModal}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAllocation}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition disabled:opacity-50"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>
                      {submittingAllocation ? "Reserving Inventory..." : "Confirm & Reserve Allocation"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
