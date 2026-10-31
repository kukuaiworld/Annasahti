"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Thermometer,
  Truck,
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

export default function VolunteerTasksPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<DeliveryTaskRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await deliveriesApi.listDeliveries({ limit: 20 });
      setTasks(response.data || []);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(`Backend Error (${err.statusCode}): ${err.message}`);
      } else {
        setError(err.message || "Failed to load volunteer delivery tasks");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Active Rescue Mission Roster"
        subtitle={`${profile?.fullName || "Courier Volunteer"} • Rapid Rescue Fleet Dispatch`}
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Breadcrumbs
            items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "Rescue Tasks" }]}
          />
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Tasks</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchTasks}
              className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Task Cards List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Truck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Assigned Delivery Tasks</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You currently have no active courier assignments. When an allocation is confirmed and assigned to you, your route instructions will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {task.batch_code || "CONSIGNMENT"}
                      </span>
                      <StatusBadge status={task.status} size="sm" />
                      <span className="text-[11px] text-slate-400 font-mono">
                        Task: {task.id.substring(0, 8)}...
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {task.food_name || "Food Rescue Consignment"}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Pickup: <strong>{task.donor_name || "Donor"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Dropoff: <strong>{task.recipient_name || "Recipient"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Quantity: <strong>{task.allocated_quantity} {task.quantity_unit}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    <Link
                      href={`/volunteer/tasks/${task.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Execute Mission</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
