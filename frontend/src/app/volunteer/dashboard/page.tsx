"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Navigation,
  CheckCircle2,
  Trophy,
  Zap,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck,
  Leaf,
  RefreshCw,
  AlertTriangle,
  Building2,
  Scale,
} from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { deliveriesApi } from "@/services/api/deliveries";
import { DeliveryTaskRecord } from "@/types/deliveries";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/services/api/api-errors";

export default function VolunteerDashboardPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<DeliveryTaskRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await deliveriesApi.listDeliveries({ limit: 10 });
      setTasks(response.data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load volunteer mission data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived metrics from verified backend tasks
  const assignedCount = tasks.filter((t) => t.status === "assigned" || t.status === "accepted").length;
  const inTransitCount = tasks.filter((t) => t.status === "in_transit" || t.status === "pickup_confirmed").length;
  const completedCount = tasks.filter((t) => t.status === "delivered" || t.status === "discrepancy_reported").length;

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Volunteer Mission Control"
        subtitle={`${profile?.fullName || "Courier Volunteer"} • Rapid Rescue Fleet Dispatch`}
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Breadcrumbs
            items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "Mission Dashboard" }]}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Awaiting Pickup</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {loading ? "--" : assignedCount}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Ready at donor dock</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">In Transit</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {loading ? "--" : inTransitCount}
              </div>
              <span className="text-[10px] text-amber-600 font-semibold mt-1 block">En route to shelter</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Verified Delivered</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {loading ? "--" : completedCount}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Confirmed by recipient</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Mission Roster Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Assigned Delivery Tasks
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active food transportation missions assigned to your courier ID
              </p>
            </div>
            <Link
              href="/volunteer/tasks"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">No active delivery assignments.</p>
              <p className="text-slate-400">When donor allocations are routed to you, tasks will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {task.batch_code || "CONSIGNMENT"}
                      </span>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{task.food_name}</h3>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                      <span>From: <strong>{task.donor_name}</strong></span>
                      <span>To: <strong>{task.recipient_name}</strong></span>
                      <span>Quantity: <strong>{task.allocated_quantity} {task.quantity_unit}</strong></span>
                    </div>
                  </div>

                  <Link
                    href={`/volunteer/tasks/${task.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition self-start md:self-auto"
                  >
                    <span>Execute Mission</span>
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
