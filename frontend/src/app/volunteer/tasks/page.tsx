"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Navigation,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Thermometer,
  Zap,
} from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { VolunteerTask } from "@/types";

export default function VolunteerTasksPage() {
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = () => {
    setTasks(storageService.getVolunteerTasks());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("annasathi_storage_update", loadData);
    return () => window.removeEventListener("annasathi_storage_update", loadData);
  }, []);

  const handleAdvanceStatus = (taskId: string, currentStatus: string) => {
    let nextStatus = currentStatus;
    let notice = "";

    if (currentStatus === "assigned") {
      nextStatus = "en_route";
      notice = "Mission accepted! En route to pickup dock.";
    } else if (currentStatus === "en_route") {
      nextStatus = "delivered";
      notice = "Consignment handed over to shelter trustee. 150 Karma points added!";
    }

    storageService.updateVolunteerTask(taskId, { status: nextStatus as any });
    setActionNotice(notice);
    setTimeout(() => setActionNotice(null), 3000);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Active Rescue Mission Roster"
        subtitle="Manage assigned pickups, temperature testing and dropoff checkpoints"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "Rescue Tasks" }]} />

        {actionNotice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Task Cards */}
        <div className="space-y-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-base">{task.title}</h3>
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consignment: {task.donationId} • {task.totalKg} kg payload (~{task.servings} meals)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>+{task.rewardPoints} Karma Points</span>
                  </span>
                </div>
              </div>

              {/* Waypoint details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Pickup Origin</span>
                  <p className="font-bold text-slate-900">{task.donorName}</p>
                  <p className="text-slate-600">{task.donorAddress}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Recipient Dropoff</span>
                  <p className="font-bold text-slate-900">{task.recipientName}</p>
                  <p className="text-slate-600">{task.recipientAddress}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/volunteer/routes"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Turn-by-Turn GPS Map</span>
                </Link>

                {task.status !== "delivered" && (
                  <button
                    onClick={() => handleAdvanceStatus(task.id, task.status)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {task.status === "assigned"
                        ? "Accept Mission & Depart"
                        : "Confirm Safe Dropoff & Collect Karma"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
