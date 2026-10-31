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
  Truck,
  ShieldCheck,
  RefreshCw,
  Info,
  Phone,
  User,
  X,
} from "lucide-react";
import { allocationsApi } from "@/services/api/allocations";
import { FoodAllocationRecord } from "@/types/allocations";
import { useAuth } from "@/providers/auth-provider";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

export default function AllocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const allocationId = params.allocationId as string;
  const { user, profile } = useAuth();

  const [allocation, setAllocation] = useState<FoodAllocationRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [reasonInput, setReasonInput] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const fetchAllocation = useCallback(async () => {
    if (!allocationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await allocationsApi.getAllocationById(allocationId);
      setAllocation(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isNotFound()) {
          setError(
            "Food allocation record not found or you do not have permission to view this reservation."
          );
        } else {
          setError(`Backend Error (${err.statusCode}): ${err.message}`);
        }
      } else {
        setError(err.message || "Failed to load allocation details");
      }
    } finally {
      setLoading(false);
    }
  }, [allocationId]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation]);

  const handleAccept = async () => {
    if (!allocation) return;
    setActionError(null);
    setActionSuccess(null);
    setSubmittingAction(true);
    try {
      await allocationsApi.acceptAllocation(allocation.id);
      setActionSuccess("Allocation offer successfully accepted.");
      await fetchAllocation();
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

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocation || !reasonInput.trim()) return;
    setActionError(null);
    setSubmittingAction(true);
    try {
      await allocationsApi.rejectAllocation(allocation.id, reasonInput.trim());
      setActionSuccess("Allocation declined and stock released back to batch balance.");
      setIsRejectModalOpen(false);
      setReasonInput("");
      await fetchAllocation();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setActionError(`Decline Failed (${err.statusCode}): ${err.message}`);
      } else {
        setActionError(err.message || "Failed to decline allocation");
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocation || !reasonInput.trim()) return;
    setActionError(null);
    setSubmittingAction(true);
    try {
      await allocationsApi.cancelAllocation(allocation.id, reasonInput.trim());
      setActionSuccess("Allocation reservation cancelled and stock restored to batch balance.");
      setIsCancelModalOpen(false);
      setReasonInput("");
      await fetchAllocation();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setActionError(`Cancellation Failed (${err.statusCode}): ${err.message}`);
      } else {
        setActionError(err.message || "Failed to cancel allocation");
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !allocation) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Allocation Not Found</h2>
        <p className="text-sm text-slate-600">{error || "Allocation record is unavailable."}</p>
        <div className="pt-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const isTerminal = ["fulfilled", "cancelled", "expired"].includes(allocation.status);
  const isPending = allocation.status === "pending";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Allocations</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-brand-800 bg-brand-50 px-2.5 py-0.5 rounded border border-brand-200">
                {allocation.batch_code || "CONSIGNMENT"}
              </span>
              <StatusBadge status={allocation.status} />
              {allocation.batch_category && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full capitalize">
                  {allocation.batch_category.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
              {allocation.food_name || "Food Allocation Record"}
            </h1>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            ID: {allocation.id}
          </span>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-brand-600" />
          <span>Reservation Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium">Donor Organisation</span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{allocation.donor_name || "Food Donor"}</span>
            </p>
            {allocation.donor_address && (
              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{allocation.donor_address}</span>
              </p>
            )}
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium">Recipient Organisation</span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{allocation.recipient_name || "Recipient Charity"}</span>
            </p>
            {allocation.recipient_address && (
              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{allocation.recipient_address}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Allocated Quantity:</span>
            <strong className="text-slate-900 text-sm">
              {allocation.allocated_quantity} {allocation.quantity_unit}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Reservation Status:</span>
            <span className="capitalize font-bold text-slate-800">{allocation.status}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Reserved On:</span>
            <span className="text-slate-700">{new Date(allocation.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Accepted On:</span>
            <span className="text-slate-700">
              {allocation.accepted_at ? new Date(allocation.accepted_at).toLocaleString() : "Pending Acceptance"}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Task Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-600" />
          <span>Linked Delivery Task</span>
        </h2>

        {allocation.deliveryTasks && allocation.deliveryTasks.length > 0 ? (
          <div className="space-y-3">
            {allocation.deliveryTasks.map((task) => (
              <div
                key={task.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} size="sm" />
                    <span className="text-slate-500 font-mono text-[11px]">Task: {task.id.substring(0, 8)}...</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    Created: {new Date(task.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400">Assigned Volunteer:</span>{" "}
                    <strong>{task.volunteer_name || "Awaiting Volunteer Assignment"}</strong>
                  </div>
                  {task.volunteer_phone && (
                    <div className="flex items-center gap-1 text-brand-700">
                      <Phone className="w-3 h-3" />
                      <span>{task.volunteer_phone}</span>
                    </div>
                  )}
                  {task.pickup_deadline && (
                    <div>
                      <span className="text-slate-400">Pickup Deadline:</span>{" "}
                      <span>{new Date(task.pickup_deadline).toLocaleString()}</span>
                    </div>
                  )}
                  {task.delivery_deadline && (
                    <div>
                      <span className="text-slate-400">Delivery Deadline:</span>{" "}
                      <span>{new Date(task.delivery_deadline).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No delivery task details available for this record.</p>
        )}
      </div>

      {/* Role-Specific Actions Bar */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-500">
          Status: <strong className="capitalize">{allocation.status}</strong>
        </span>

        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleAccept}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept Offer (Recipient)</span>
              </button>

              <button
                type="button"
                disabled={submittingAction}
                onClick={() => {
                  setReasonInput("");
                  setIsRejectModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Decline Offer (Recipient)</span>
              </button>
            </>
          )}

          {!isTerminal && (
            <button
              type="button"
              disabled={submittingAction}
              onClick={() => {
                setReasonInput("");
                setIsCancelModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-200 transition"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Reservation (Donor)</span>
            </button>
          )}
        </div>
      </div>

      {/* REJECT MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Decline Allocation Offer</h3>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="State the reason why your organisation cannot accept this food consignment..."
                  rows={3}
                  maxLength={500}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
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

      {/* CANCEL MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Cancel Food Reservation</h3>
            <form onSubmit={handleCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="State the reason for cancelling this allocation..."
                  rows={3}
                  maxLength={500}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Keep Reservation
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{submittingAction ? "Cancelling..." : "Confirm Cancellation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
