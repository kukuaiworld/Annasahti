"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  PlusCircle,
  Truck,
  Leaf,
  Users,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Building,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { batchesApi } from "@/services/api/batches";
import { useAuth } from "@/providers/auth-provider";
import { FoodBatchRecord, FoodBatchStatus } from "@/types/batches";

export default function DonorDashboardPage() {
  const { user, profile, organisation } = useAuth();
  const activeOrgId = organisation?.id || profile?.organisationId;
  const activeOrgName = organisation?.name || profile?.fullName || "Donor Organisation";

  const [batches, setBatches] = useState<FoodBatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await batchesApi.listBatches({
        donorOrganisationId: activeOrgId,
        limit: 10,
      });
      setBatches(response.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load dashboard batches from server.");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalBatches = batches.length;
  const pendingInspectionCount = batches.filter(
    (b) => b.status === FoodBatchStatus.PENDING_INSPECTION || b.status === FoodBatchStatus.HOLD
  ).length;
  const approvedCount = batches.filter(
    (b) => b.status === FoodBatchStatus.APPROVED || b.status === FoodBatchStatus.ALLOCATED
  ).length;
  const inTransitOrDeliveredCount = batches.filter(
    (b) => b.status === FoodBatchStatus.IN_TRANSIT || b.status === FoodBatchStatus.COMPLETED
  ).length;

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Commercial Kitchen Operations"
        subtitle={`${activeOrgName} • FoodLoop Donor Console`}
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Donor Portal", href: "/donor/dashboard" },
            { label: "Operations Dashboard" },
          ]}
        />

        {/* Organisation Verification Banner */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{activeOrgName}</h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    organisation?.verification_status === "verified"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {organisation?.verification_status || "Registered Donor"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authenticated User: <strong>{user?.email || "Donor Representative"}</strong>
                {activeOrgId ? ` • ID: ${activeOrgId.slice(0, 8)}...` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/donor/new-donation"
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Surplus Batch</span>
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Real KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Recent Batches</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {loading ? "..." : totalBatches}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                Logged in database
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Pending Inspection</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {loading ? "..." : pendingInspectionCount}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold mt-1 block">
                Food Safety HOLD
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Approved / Allocated</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {loading ? "..." : approvedCount}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                Human verified
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">In Transit / Completed</span>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {loading ? "..." : inTransitOrDeliveredCount}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                Courier active
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Environmental & Caloric Accounting Integrity Note */}
        <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-3">
          <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 block">Verified Environmental Accounting:</span>
            <span>
              Per FoodLoop ESG standards, avoided landfill methane and meals served are calculated exclusively from recipient-confirmed delivered quantities recorded on SafeChain. Unverified or estimated numbers are never displayed as verified impact.
            </span>
          </div>
        </div>

        {/* Recent Batches List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Recent Consignment Ledgers</h3>
            <Link
              href="/donor/donations"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View full ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
              <span>Loading real consignment data from backend...</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 space-y-2">
              <p>No surplus food batches have been registered yet for this organisation.</p>
              <Link
                href="/donor/new-donation"
                className="inline-block text-brand-600 font-semibold underline mt-1"
              >
                Post your first surplus batch
              </Link>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Batch Code</th>
                  <th className="py-3 px-4">Food Item</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Listed Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {batches.slice(0, 5).map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                      {batch.batch_code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{batch.food_name}</td>
                    <td className="py-3.5 px-4">
                      {batch.quantity} {batch.quantity_unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={batch.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
