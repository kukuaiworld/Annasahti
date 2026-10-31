"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Search,
  Filter,
  PlusCircle,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  HeartHandshake,
} from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { batchesApi } from "@/services/api/batches";
import { useAuth } from "@/providers/auth-provider";
import { FoodBatchRecord, FoodBatchStatus } from "@/types/batches";

export default function DonorDonationsPage() {
  const { user, profile, organisation } = useAuth();
  const activeOrgId = organisation?.id || profile?.organisationId;

  const [batches, setBatches] = useState<FoodBatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await batchesApi.listBatches({
        donorOrganisationId: activeOrgId,
        status: filterStatus === "all" ? undefined : (filterStatus as FoodBatchStatus),
        search: searchTerm.trim() || undefined,
        page,
        limit: 10,
      });

      setBatches(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalCount(response.meta?.total || 0);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to load food batch consignments from backend API."
      );
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, filterStatus, searchTerm, page]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBatches();
  };

  const statusFilterOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Pending Inspection", value: FoodBatchStatus.PENDING_INSPECTION },
    { label: "Approved", value: FoodBatchStatus.APPROVED },
    { label: "Allocated", value: FoodBatchStatus.ALLOCATED },
    { label: "In Transit", value: FoodBatchStatus.IN_TRANSIT },
    { label: "Completed", value: FoodBatchStatus.COMPLETED },
    { label: "Hold / Review", value: FoodBatchStatus.HOLD },
    { label: "Cancelled", value: FoodBatchStatus.CANCELLED },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Donation Ledger & Consignments"
        subtitle="Live FoodLoop consignment ledger verified by backend PostgreSQL database"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs
          items={[
            { label: "Donor Portal", href: "/donor/dashboard" },
            { label: "Donation Ledger" },
          ]}
        />

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by food name or batch code (e.g. FL-)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold w-full lg:w-auto">
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setFilterStatus(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  filterStatus === opt.value
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}

            <button
              type="button"
              onClick={fetchBatches}
              title="Refresh"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition ml-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Batch Records */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs space-y-3">
              <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
              <p>Fetching real consignment records from FoodLoop backend...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs space-y-3">
              <UtensilsCrossed className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">No consignment records found.</p>
              <p className="text-slate-400 max-w-sm mx-auto">
                No food batches match your filter criteria. Ready to list fresh surplus?
              </p>
              <div className="pt-2">
                <Link
                  href="/donor/new-donation"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-brand-700 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post New Surplus Consignment</span>
                </Link>
              </div>
            </div>
          ) : (
            batches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {batch.batch_code}
                    </span>
                    <StatusBadge status={batch.status} size="sm" />
                    {batch.created_at && (
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Listed: {new Date(batch.created_at).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">
                      {batch.quantity} {batch.quantity_unit}
                    </span>
                    {batch.estimated_weight_kg && (
                      <span className="text-[11px] text-slate-400 block">
                        (~{batch.estimated_weight_kg} kg estimated)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-6 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Food Consignment
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{batch.food_name}</p>
                    {batch.description && (
                      <p className="text-slate-600 text-[11px] line-clamp-2">
                        {batch.description}
                      </p>
                    )}
                    {batch.storage_instructions && (
                      <p className="text-[11px] text-slate-500 italic">
                        Storage: {batch.storage_instructions}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3 space-y-1 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Safety & Dates
                    </span>
                    <p className="text-slate-700">
                      <strong>Best Before:</strong>{" "}
                      {batch.best_before_at
                        ? new Date(batch.best_before_at).toLocaleString()
                        : "Not specified"}
                    </p>
                    <p className="text-slate-700">
                      <strong>Pickup Deadline:</strong>{" "}
                      {batch.pickup_deadline
                        ? new Date(batch.pickup_deadline).toLocaleString()
                        : "Flexible"}
                    </p>
                  </div>

                  <div className="md:col-span-3 space-y-1 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Allocation Progress
                    </span>
                    <p className="text-slate-700">
                      Allocated: <strong>{batch.allocated_quantity || 0}</strong> {batch.quantity_unit}
                    </p>
                    <p className="text-slate-700">
                      Delivered: <strong>{batch.delivered_quantity || 0}</strong> {batch.quantity_unit}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      Available: {batch.available_quantity ?? batch.quantity} {batch.quantity_unit}
                    </p>
                  </div>
                </div>

                {/* Batch Action Bar */}
                {([FoodBatchStatus.APPROVED, FoodBatchStatus.PARTIALLY_ALLOCATED].includes(batch.status) &&
                  Number(batch.available_quantity ?? batch.quantity) > 0) && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 font-medium">
                      ✓ Inspection Certified: Ready for Recipient Matching
                    </span>
                    <Link
                      href={`/donor/batches/${batch.id}/matches`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Find Matches & Allocate</span>
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <span>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total consignments)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition flex items-center gap-1"
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
