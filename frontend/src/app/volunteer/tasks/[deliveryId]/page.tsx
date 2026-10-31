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
  Truck,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Navigation,
  Phone,
  PackageCheck,
  Info,
} from "lucide-react";
import { deliveriesApi } from "@/services/api/deliveries";
import { DeliveryTaskRecord } from "@/types/deliveries";
import { useAuth } from "@/providers/auth-provider";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

export default function VolunteerTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.deliveryId as string;
  const { user, profile } = useAuth();

  const [delivery, setDelivery] = useState<DeliveryTaskRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pickup Action States
  const [pickupNotes, setPickupNotes] = useState<string>("");
  const [submittingPickup, setSubmittingPickup] = useState<boolean>(false);
  const [pickupSuccess, setPickupSuccess] = useState<string | null>(null);
  const [pickupError, setPickupError] = useState<string | null>(null);

  const fetchDelivery = useCallback(async () => {
    if (!deliveryId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await deliveriesApi.getDeliveryById(deliveryId);
      setDelivery(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isNotFound()) {
          setError("Delivery task not found or you do not have permission to access this mission.");
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

  const handleConfirmPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    setPickupError(null);
    setPickupSuccess(null);
    setSubmittingPickup(true);

    try {
      await deliveriesApi.recordPickup(delivery.id, {
        pickupNotes: pickupNotes.trim() || undefined,
      });
      setPickupSuccess("Pickup recorded! Batch status transitioned to IN_TRANSIT on the SafeChain ledger.");
      await fetchDelivery();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setPickupError(`Pickup Rejection (${err.statusCode}): ${err.message}`);
      } else {
        setPickupError(err.message || "Failed to record pickup");
      }
    } finally {
      setSubmittingPickup(false);
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

  if (error || !delivery) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Task</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <div className="pt-2">
          <Link
            href="/volunteer/tasks"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Volunteer Missions</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAssigned = delivery.status === "assigned" || delivery.status === "accepted";
  const isInTransit = delivery.status === "in_transit" || delivery.status === "pickup_confirmed";
  const isDelivered = delivery.status === "delivered" || delivery.status === "discrepancy_reported";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <div className="space-y-2">
        <Link
          href="/volunteer/tasks"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Rescue Tasks</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {delivery.batch_code || "CONSIGNMENT"}
              </span>
              <StatusBadge status={delivery.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
              {delivery.food_name || "Food Delivery Mission"}
            </h1>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Task ID: {delivery.id.substring(0, 8)}...
          </span>
        </div>
      </div>

      {pickupSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-start gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{pickupSuccess}</span>
        </div>
      )}

      {pickupError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{pickupError}</span>
        </div>
      )}

      {/* Route Stops Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stop 1: Pickup Dock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>1. Pickup Dock (Donor)</span>
            </span>
            {delivery.pickup_confirmed_at && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Picked Up
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">{delivery.donor_name}</h3>
          {delivery.donor_address && (
            <p className="text-xs text-slate-500 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{delivery.donor_address}</span>
            </p>
          )}
          {delivery.pickup_deadline && (
            <p className="text-xs text-amber-800 flex items-center gap-1 font-medium pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pickup By: {new Date(delivery.pickup_deadline).toLocaleString()}</span>
            </p>
          )}
        </div>

        {/* Stop 2: Dropoff Dock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5" />
              <span>2. Dropoff Dock (Recipient)</span>
            </span>
            {isDelivered && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Confirmed
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">{delivery.recipient_name}</h3>
          {delivery.recipient_address && (
            <p className="text-xs text-slate-500 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{delivery.recipient_address}</span>
            </p>
          )}
          {delivery.delivery_deadline && (
            <p className="text-xs text-slate-600 flex items-center gap-1 font-medium pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Deliver By: {new Date(delivery.delivery_deadline).toLocaleString()}</span>
            </p>
          )}
        </div>
      </div>

      {/* Cargo Information Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Consignment Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Quantity to Transport:</span>
            <strong className="text-slate-900 font-bold text-sm">
              {delivery.allocated_quantity} {delivery.quantity_unit}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Current Status:</span>
            <span className="capitalize font-bold text-slate-800">{delivery.status.replace(/_/g, " ")}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Handling & Storage:</span>
            <span className="text-slate-700">{delivery.storage_instructions || "Standard ambient"}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium">Courier:</span>
            <span className="text-slate-800 font-semibold">{delivery.volunteer_name || "Assigned"}</span>
          </div>
        </div>
      </div>

      {/* Action Sections */}
      {isAssigned && (
        <form onSubmit={handleConfirmPickup} className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Food Pickup at Donor Location
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm that you have arrived at <strong>{delivery.donor_name}</strong> and loaded the food into your insulated transport bag or vehicle.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pickup Dock Observations (Optional)
            </label>
            <input
              type="text"
              value={pickupNotes}
              onChange={(e) => setPickupNotes(e.target.value)}
              placeholder="e.g. Trays sealed, checked with chef, loaded in cold bag..."
              maxLength={500}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submittingPickup}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              <span>{submittingPickup ? "Recording Pickup..." : "Confirm Food Loaded & Depart"}</span>
            </button>
          </div>
        </form>
      )}

      {isInTransit && (
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Consignment Is In Transit to {delivery.recipient_name}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Proceed directly to the recipient dropoff dock. Upon arrival, the shelter recipient will independently count and confirm verified receipt.
              </p>
            </div>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100 text-xs text-slate-700">
            <strong>FoodLoop Safety Governance Rule:</strong> Volunteers cannot unilaterally confirm delivery receipt. Independent recipient dock verification ensures immutable impact measurement.
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-emerald-900">
            Delivery Verified & Completed
          </h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            The recipient confirmed receipt of this food consignment.
            {delivery.received_quantity !== undefined && ` Received: ${delivery.received_quantity} ${delivery.quantity_unit}.`}
            {delivery.confirmed_at && ` Verified on ${new Date(delivery.confirmed_at).toLocaleString()}.`}
          </p>
        </div>
      )}
    </div>
  );
}
