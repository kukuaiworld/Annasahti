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
  User,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import { deliveriesApi } from "@/services/api/deliveries";
import { CompleteDeliveryDto, DeliveryTaskRecord } from "@/types/deliveries";
import { useAuth } from "@/providers/auth-provider";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

export default function RecipientDeliveryConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.deliveryId as string;
  const { profile } = useAuth();

  const [delivery, setDelivery] = useState<DeliveryTaskRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [receivedQty, setReceivedQty] = useState<string>("");
  const [damagedQty, setDamagedQty] = useState<string>("0");
  const [missingQty, setMissingQty] = useState<string>("0");
  const [discrepancyReason, setDiscrepancyReason] = useState<string>("");
  const [canDivertToWaste, setCanDivertToWaste] = useState<boolean>(false);
  const [recipientNotes, setRecipientNotes] = useState<string>("");
  const [humanCertified, setHumanCertified] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchDelivery = useCallback(async () => {
    if (!deliveryId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await deliveriesApi.getDeliveryById(deliveryId);
      setDelivery(data);
      // Pre-fill received quantity with allocated quantity
      if (data.allocated_quantity) {
        setReceivedQty(String(data.allocated_quantity));
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isNotFound()) {
          setError("Delivery task not found or you do not have permission to confirm this delivery.");
        } else {
          setError(`Backend Error (${err.statusCode}): ${err.message}`);
        }
      } else {
        setError(err.message || "Failed to load delivery task");
      }
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  // Reconciliation calculation
  const allocated = Number(delivery?.allocated_quantity || 0);
  const received = parseFloat(receivedQty) || 0;
  const damaged = parseFloat(damagedQty) || 0;
  const missing = parseFloat(missingQty) || 0;
  const currentTotal = received + damaged + missing;
  const isReconciled = Math.abs(currentTotal - allocated) <= 0.001;
  const hasDiscrepancy = damaged > 0 || missing > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!humanCertified) {
      setSubmitError("You must certify that you have physically inspected the consignment at your dock.");
      return;
    }

    if (!isReconciled) {
      setSubmitError(
        `ACCOUNTING RECONCILIATION FAILED: Sum of received (${received}), damaged (${damaged}), and missing (${missing}) must equal allocated quantity (${allocated} ${delivery.quantity_unit}).`
      );
      return;
    }

    if (hasDiscrepancy && !discrepancyReason.trim()) {
      setSubmitError("A discrepancy reason is required when damaged or missing quantities are reported.");
      return;
    }

    const payload: CompleteDeliveryDto = {
      receivedQuantity: received,
      damagedQuantity: damaged,
      missingQuantity: missing,
      quantityUnit: delivery.quantity_unit || "portions",
      discrepancyReason: hasDiscrepancy ? discrepancyReason.trim() : undefined,
      canBeDivertedToWaste: canDivertToWaste,
      recipientNotes: recipientNotes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const result = await deliveriesApi.completeDelivery(delivery.id, payload);
      setSubmitSuccess(
        `Delivery receipt confirmed! ${received} ${delivery.quantity_unit} recorded into verified rescue outcomes.`
      );
      await fetchDelivery();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setSubmitError(`Confirmation Rejection (${err.statusCode}): ${err.message}`);
      } else {
        setSubmitError(err.message || "Failed to submit delivery confirmation");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Delivery</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <div className="pt-2">
          <Link
            href="/recipient/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Recipient Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyConfirmed = ["delivered", "discrepancy_reported"].includes(delivery.status);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto w-full">
      {/* Top Header */}
      <div className="space-y-2">
        <Link
          href="/recipient/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shelter Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                {delivery.batch_code || "CONSIGNMENT"}
              </span>
              <StatusBadge status={delivery.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
              Confirm Delivery Receipt
            </h1>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Task ID: {delivery.id.substring(0, 8)}...
          </span>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{delivery.food_name}</h2>
            <p className="text-xs text-slate-500">
              Dispatched from <strong>{delivery.donor_name}</strong> to <strong>{delivery.recipient_name}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Allocated Balance
            </span>
            <span className="text-base font-extrabold text-purple-700">
              {delivery.allocated_quantity} {delivery.quantity_unit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Courier Volunteer: <strong>{delivery.volunteer_name || "Assigned Courier"}</strong></span>
          </div>
          {delivery.pickup_confirmed_at && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Picked Up: {new Date(delivery.pickup_confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Form */}
      {isAlreadyConfirmed ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-emerald-900">
            Delivery Receipt Already Confirmed
          </h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            This delivery task was verified on {delivery.confirmed_at ? new Date(delivery.confirmed_at).toLocaleString() : "recently"}.
            Received: <strong>{delivery.received_quantity} {delivery.quantity_unit}</strong>
            {Number(delivery.damaged_quantity || 0) > 0 && ` • Damaged: ${delivery.damaged_quantity}`}
            {Number(delivery.missing_quantity || 0) > 0 && ` • Missing: ${delivery.missing_quantity}`}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-purple-600" />
              <span>Independent Recipient Receipt & Reconciliation</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Food safety governance requires the recipient organisation to independently count and inspect delivered goods before closing the rescue mission.
            </p>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Quantity Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Received in Good Condition <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 bg-white pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold uppercase">
                    {delivery.quantity_unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Damaged in Transit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 bg-white pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold uppercase">
                    {delivery.quantity_unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Missing / Unaccounted
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={missingQty}
                    onChange={(e) => setMissingQty(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 bg-white pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold uppercase">
                    {delivery.quantity_unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Reconciliation Live Status Bar */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                isReconciled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {isReconciled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  Reconciliation: <strong>{currentTotal}</strong> / <strong>{allocated}</strong> {delivery.quantity_unit}
                </span>
              </div>
              <span className="font-bold">
                {isReconciled ? "✓ Reconciled exactly" : `Difference: ${(allocated - currentTotal).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Conditional Discrepancy Reason */}
          {hasDiscrepancy && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Discrepancy & Loss Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  placeholder="Specify details regarding damaged or missing portions (e.g. cracked trays during transit, count mismatch at vehicle door)..."
                  rows={2}
                  maxLength={500}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {damaged > 0 && (
                <label className="flex items-center gap-2 text-xs text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canDivertToWaste}
                    onChange={(e) => setCanDivertToWaste(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Can damaged portions be safely diverted to organic waste or composting?</span>
                </label>
              )}
            </div>
          )}

          {/* Recipient Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Arrival Notes (Optional)
            </label>
            <textarea
              value={recipientNotes}
              onChange={(e) => setRecipientNotes(e.target.value)}
              placeholder="e.g. Food arrived hot, placed directly in insulated meal warmer..."
              rows={2}
              maxLength={500}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

          {/* Mandatory Certification Checkbox */}
          <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={humanCertified}
                onChange={(e) => setHumanCertified(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <div className="text-xs text-slate-800 leading-snug">
                <span className="font-bold text-purple-900 block">
                  Authorised Recipient Certification
                </span>
                <span>
                  I confirm that our recipient organisation has physically received and verified the consignment quantities above. I understand that this confirmation officially closes the allocation and triggers SafeChain verified impact accounting.
                </span>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !humanCertified || !isReconciled}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{submitting ? "Confirming Receipt..." : "Confirm Verified Receipt"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
