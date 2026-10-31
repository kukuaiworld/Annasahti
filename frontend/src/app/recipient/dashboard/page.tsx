"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  AlertTriangle,
  Building2,
  Scale,
  PackageCheck,
  Inbox,
} from "lucide-react";
import RecipientHeader from "@/components/recipient/RecipientHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { allocationsApi } from "@/services/api/allocations";
import { deliveriesApi } from "@/services/api/deliveries";
import { FoodAllocationRecord } from "@/types/allocations";
import { DeliveryTaskRecord } from "@/types/deliveries";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/services/api/api-errors";

export default function RecipientDashboardPage() {
  const { profile, organisation } = useAuth();
  const [allocations, setAllocations] = useState<FoodAllocationRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryTaskRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch allocations and deliveries for active recipient
      const [allocRes, delivRes] = await Promise.all([
        allocationsApi.listAllocations({ limit: 10 }),
        deliveriesApi.listDeliveries({ limit: 10 }),
      ]);
      setAllocations(allocRes.data || []);
      setDeliveries(delivRes.data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load recipient dashboard data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics from verified backend data
  const pendingAllocations = allocations.filter((a) => a.status === "pending");
  const acceptedAllocations = allocations.filter((a) => a.status === "accepted");
  const inTransitDeliveries = deliveries.filter((d) => d.status === "in_transit" || d.status === "pickup_confirmed");
  const completedDeliveries = deliveries.filter((d) => d.status === "delivered" || d.status === "discrepancy_reported");

  return (
    <div className="flex-1 flex flex-col">
      <RecipientHeader
        title="Shelter Care & Kitchen Operations"
        subtitle={`${organisation?.name || profile?.fullName || "Recipient Organisation"} • Verified Shelter Hub`}
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Breadcrumbs
            items={[{ label: "Recipient Portal", href: "/recipient/dashboard" }, { label: "Dashboard" }]}
          />
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
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

        {/* Real KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Offers Awaiting Review</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {loading ? "--" : pendingAllocations.length}
              </div>
              <span className="text-[10px] text-purple-600 font-semibold mt-1 block">
                Pending your acceptance
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Inbox className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Accepted Allocations</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {loading ? "--" : acceptedAllocations.length}
              </div>
              <span className="text-[10px] text-brand-600 font-semibold mt-1 block">
                Reserved for your shelter
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">In-Transit Couriers</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {loading ? "--" : inTransitDeliveries.length}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                Volunteers en route
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Verified Confirmations</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {loading ? "--" : completedDeliveries.length}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                Officially received at dock
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Priority Deliveries Awaiting Dock Confirmation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Active Deliveries En Route to Your Shelter
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical inspection required at arrival dock before signing delivery confirmation
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">No active deliveries in transit.</p>
              <p className="text-slate-400">Accepted allocations will display courier milestones here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deliveries.map((deliv) => {
                const isConfirmed = ["delivered", "discrepancy_reported"].includes(deliv.status);
                return (
                  <div
                    key={deliv.id}
                    className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {deliv.batch_code || "CONSIGNMENT"}
                        </span>
                        <StatusBadge status={deliv.status} size="sm" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{deliv.food_name}</h3>
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span>From: <strong>{deliv.donor_name}</strong></span>
                        <span>Quantity: <strong>{deliv.allocated_quantity} {deliv.quantity_unit}</strong></span>
                        <span>Courier: <strong>{deliv.volunteer_name || "Volunteer Courier"}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isConfirmed ? (
                        <Link
                          href={`/recipient/deliveries/${deliv.id}/confirm`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Confirm Receipt</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Receipt Confirmed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Incoming Allocation Offers Quick List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Pending Allocation Offers ({pendingAllocations.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Donations matched and offered by local commercial kitchens
              </p>
            </div>
            <Link
              href="/recipient/allocations"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition"
            >
              <span>View All Allocations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingAllocations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">No pending offers.</p>
              <p className="text-slate-400">All incoming donation allocations have been reviewed.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingAllocations.map((alloc) => (
                <div
                  key={alloc.id}
                  className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                        {alloc.batch_code || "BATCH"}
                      </span>
                      <StatusBadge status={alloc.status} size="sm" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{alloc.food_name}</h3>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>Donor: <strong>{alloc.donor_name}</strong></span>
                      <span>Offered: <strong>{alloc.allocated_quantity} {alloc.quantity_unit}</strong></span>
                    </div>
                  </div>

                  <Link
                    href="/recipient/allocations"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition self-start md:self-auto"
                  >
                    <span>Review Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
