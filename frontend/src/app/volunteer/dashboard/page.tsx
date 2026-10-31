"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { VolunteerTask } from "@/types";

export default function VolunteerDashboardPage() {
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);

  useEffect(() => {
    setTasks(storageService.getVolunteerTasks());
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Volunteer Mission Control"
        subtitle="Aarav Sharma • Delhi NCR E-Rickshaw Rapid Fleet"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "Mission Dashboard" }]} />

        {/* Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Missions Completed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">148</div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">100% on-time rate</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Food Delivered</span>
              <div className="text-2xl font-black text-slate-900 mt-1">4,120 kg</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">~10,800 meals served</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Karma Points</span>
              <div className="text-2xl font-black text-amber-600 mt-1">4,850</div>
              <span className="text-[10px] text-amber-700 font-semibold mt-1 block">City Rank #1 (Legend)</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Certified Vehicle</span>
              <div className="text-lg font-black text-slate-900 mt-1">E-Rickshaw #DL-04</div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Insulated thermal bin</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Live Active Mission Box */}
        <div className="bg-white rounded-3xl border border-blue-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
              <h3 className="font-bold text-slate-900 text-base">Active Rescue Mission in Progress</h3>
            </div>
            <Link
              href="/volunteer/routes"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Launch Live GPS Map</span>
            </Link>
          </div>

          {tasks.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{tasks[0].title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tasks[0].totalKg} kg ({tasks[0].servings} meals) • ETA: {tasks[0].etaMinutes} mins
                  </p>
                </div>
                <StatusBadge status={tasks[0].status} size="sm" />
              </div>

              {/* Waypoints Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                {tasks[0].routeStops.map((stop) => (
                  <div
                    key={stop.order}
                    className={`p-3 rounded-xl border ${
                      stop.completed ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[10px] uppercase text-slate-500">Stop {stop.order}</span>
                      {stop.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="font-semibold text-slate-800">{stop.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{stop.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/volunteer/leaderboard"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm">City Volunteer Leaderboard</h4>
              <p className="text-xs text-slate-500 mt-0.5">See weekly point rankings across Delhi NCR</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </Link>

          <Link
            href="/volunteer/badges"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Badges & Certificates</h4>
              <p className="text-xs text-slate-500 mt-0.5">Review 4 earned honors including Cold Chain Master</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
