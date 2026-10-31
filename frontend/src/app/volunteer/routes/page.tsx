"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Navigation,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  RefreshCw,
  LocateFixed,
  PackageCheck,
  Building2,
} from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import GoogleDeliveryMap, { RouteTelemetry } from "@/components/maps/GoogleDeliveryMap";
import { deliveriesApi } from "@/services/api/deliveries";
import { DeliveryTaskRecord, DeliveryStatus } from "@/types/deliveries";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

function VolunteerRoutesContent() {
  const searchParams = useSearchParams();
  const requestedDeliveryId = searchParams.get("deliveryId");

  const [tasks, setTasks] = useState<DeliveryTaskRecord[]>([]);
  const [selectedTask, setSelectedTask] = useState<DeliveryTaskRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Volunteer Location Sharing State
  const [sharingLocation, setSharingLocation] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Google Route Telemetry State
  const [routeTelemetry, setRouteTelemetry] = useState<RouteTelemetry | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load active in_transit and assigned tasks
      const inTransitRes = await deliveriesApi.listDeliveries({
        status: DeliveryStatus.IN_TRANSIT,
        limit: 10,
      });
      const assignedRes = await deliveriesApi.listDeliveries({
        status: DeliveryStatus.ASSIGNED,
        limit: 10,
      });

      const combined = [...inTransitRes.data, ...assignedRes.data];
      // Deduplicate by ID
      const uniqueTasks = Array.from(new Map(combined.map((t) => [t.id, t])).values());
      setTasks(uniqueTasks);

      if (uniqueTasks.length > 0) {
        if (requestedDeliveryId) {
          const match = uniqueTasks.find((t) => t.id === requestedDeliveryId);
          setSelectedTask(match || uniqueTasks[0]);
        } else {
          setSelectedTask(uniqueTasks[0]);
        }
      } else {
        setSelectedTask(null);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load active delivery tasks");
      }
    } finally {
      setLoading(false);
    }
  }, [requestedDeliveryId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Request browser location permission and submit to backend
  const handleShareLocation = () => {
    if (!selectedTask) return;
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationError(null);
    setLocationSuccess(null);
    setSharingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          await deliveriesApi.updateVolunteerLocation(selectedTask.id, {
            latitude,
            longitude,
          });

          setLocationSuccess(
            `Location shared: (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). SafeChain ledger updated.`
          );

          // Update task locally
          setSelectedTask((prev) =>
            prev
              ? {
                  ...prev,
                  volunteer_lat: latitude,
                  volunteer_lng: longitude,
                  volunteer_location_updated_at: new Date().toISOString(),
                }
              : null
          );
        } catch (err: any) {
          setLocationError(err.message || "Failed to update location on the server.");
        } finally {
          setSharingLocation(false);
        }
      },
      (geoErr) => {
        setSharingLocation(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Please allow location access in your browser settings.");
        } else {
          setLocationError(`Geolocation error: ${geoErr.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Live Mission Navigation"
        subtitle="Operational Google Maps Routing & Handover Navigation"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        <Breadcrumbs
          items={[
            { label: "Volunteer Hub", href: "/volunteer/dashboard" },
            { label: "Active Routes" },
          ]}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Task Selector if multiple active missions exist */}
        {tasks.length > 1 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Select Active Mission</span>
              <span className="font-semibold text-slate-800">
                You have {tasks.length} assigned / in-transit delivery tasks
              </span>
            </div>
            <div className="flex items-center gap-2">
              {tasks.map((task, idx) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setRouteTelemetry(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedTask?.id === task.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Mission #{idx + 1}: {task.food_name?.substring(0, 16) || task.id.substring(0, 8)}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="h-96 bg-slate-200 rounded-3xl animate-pulse" />
          </div>
        ) : !selectedTask ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Active Delivery Missions</h3>
              <p className="text-xs text-slate-500">
                You currently have no food delivery tasks in progress or assigned. Claim a mission to view live pickup and dropoff routes.
              </p>
            </div>
            <Link
              href="/volunteer/tasks"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <span>Browse Available Missions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mission Overview Banner */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTask.status} />
                  <span className="text-xs text-slate-400 font-mono">
                    Task ID: {selectedTask.id.substring(0, 8)}...
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedTask.food_name || "Food Delivery Consignment"}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedTask.allocated_quantity} {selectedTask.quantity_unit || "kg"} • {selectedTask.donor_name} → {selectedTask.recipient_name}
                </p>
              </div>

              {/* Volunteer Geolocation Consent & Sharing Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <button
                  onClick={handleShareLocation}
                  disabled={sharingLocation}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition disabled:opacity-50"
                  title="Requests browser geolocation permission to update live courier location on the SafeChain ledger"
                >
                  <LocateFixed className={`w-4 h-4 text-blue-600 ${sharingLocation ? "animate-spin" : ""}`} />
                  <span>{sharingLocation ? "Acquiring GPS..." : "Share Live Courier GPS"}</span>
                </button>

                <Link
                  href={`/volunteer/tasks/${selectedTask.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition"
                >
                  <span>Task Actions & QR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {locationSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{locationSuccess}</span>
              </div>
            )}

            {locationError && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-2 shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{locationError}</span>
              </div>
            )}

            {/* Interactive Google Map Component */}
            <GoogleDeliveryMap
              donor={{
                name: selectedTask.donor_name || "Donor Organisation",
                address: selectedTask.donor_address,
                lat: selectedTask.donor_lat ?? null,
                lng: selectedTask.donor_lng ?? null,
              }}
              recipient={{
                name: selectedTask.recipient_name || "Recipient Organisation",
                address: selectedTask.recipient_address,
                lat: selectedTask.recipient_lat ?? null,
                lng: selectedTask.recipient_lng ?? null,
              }}
              volunteer={{
                name: selectedTask.volunteer_name || "You (Assigned Courier)",
                lat: selectedTask.volunteer_lat ?? null,
                lng: selectedTask.volunteer_lng ?? null,
                updatedAt: selectedTask.volunteer_location_updated_at,
              }}
              height="460px"
              onRouteCalculated={(t) => setRouteTelemetry(t)}
            />

            {/* Operational Waypoints Manifest (Database-Backed) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stop 1: Pickup */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    <span>Stop 1: Donor Pickup Dock</span>
                  </span>
                  {selectedTask.pickup_confirmed_at && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Picked Up
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-900">{selectedTask.donor_name}</h4>
                {selectedTask.donor_address && (
                  <p className="text-xs text-slate-500 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedTask.donor_address}</span>
                  </p>
                )}
                {selectedTask.pickup_deadline && (
                  <div className="text-xs text-amber-800 flex items-center gap-1 font-medium pt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pickup Deadline: {new Date(selectedTask.pickup_deadline).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Stop 2: Dropoff */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4" />
                    <span>Stop 2: Recipient Dropoff Dock</span>
                  </span>
                  {selectedTask.status === DeliveryStatus.DELIVERED && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Delivered & Reconciled
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-900">{selectedTask.recipient_name}</h4>
                {selectedTask.recipient_address && (
                  <p className="text-xs text-slate-500 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedTask.recipient_address}</span>
                  </p>
                )}
                {selectedTask.delivery_deadline && (
                  <div className="text-xs text-slate-600 flex items-center gap-1 font-medium pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Delivery Deadline: {new Date(selectedTask.delivery_deadline).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VolunteerRoutesPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500">Loading delivery route...</div>}>
      <VolunteerRoutesContent />
    </React.Suspense>
  );
}
