"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Compass,
  BatteryCharging,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function VolunteerRoutesPage() {
  const [activeStep, setActiveStep] = useState(2); // In transit

  const routeSteps = [
    {
      num: 1,
      title: "Loading Dock 2: Grand Heritage Banquets",
      address: "Civil Lines, Sector 4, North Delhi",
      eta: "Completed 05:15 AM",
      status: "done",
      notes: "80kg Paneer Butter Masala & Rice loaded into insulated thermal containers.",
    },
    {
      num: 2,
      title: "Mobile Food Safety Quality Verification",
      address: "On-site Sensor Probe Reading",
      eta: "Completed 05:22 AM",
      status: "done",
      notes: "Infrared Temp: 64°C (Pass > 60°C). Digital FSSAI seal attached: SIG-AS-7741.",
    },
    {
      num: 3,
      title: "En Route to Asha Kiran Orphanage",
      address: "Burari Road via Timarpur Flyover",
      eta: "Est. Arrival: 05:42 AM (14 mins)",
      status: "active",
      notes: "Electric Rickshaw #DL-04 cruising at 28 km/h. Zero traffic congestion.",
    },
    {
      num: 4,
      title: "Shelter Dining Hall Dropoff & QR Scan",
      address: "Asha Kiran Child Care, Timarpur",
      eta: "05:45 AM Target",
      status: "pending",
      notes: "Sister Mary Teresa on standby for QR code handover handshake.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Live GPS Mission Navigation"
        subtitle="Simulated Electric Rickshaw Turn-by-Turn Route Telemetry"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "GPS Routes" }]} />

        {/* Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">EV Fleet Battery</span>
            <div className="text-xl font-black text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <BatteryCharging className="w-5 h-5 text-emerald-500" />
              <span>78% (34 km range)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Velocity</span>
            <div className="text-xl font-black text-blue-600 mt-0.5">28 km/h</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Core Cargo Temp</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">62.8°C (Hot Safe)</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Remaining Route ETA</span>
            <div className="text-xl font-black text-purple-600 mt-0.5">14 Minutes</div>
          </div>
        </div>

        {/* Interactive Map Simulation & Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Simulated Map Graphic (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl min-h-[380px] flex flex-col justify-between border border-slate-800">
            {/* Map Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

            {/* Top route label */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                <Navigation className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Navigating: Civil Lines → Timarpur (5.6 km)</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">GPS ACCURACY: ±2m</span>
            </div>

            {/* Simulated Route Visualization Canvas */}
            <div className="relative z-10 py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600/30 border-2 border-blue-400 flex items-center justify-center text-white mb-3 shadow-lg pulsing-dot">
                <Truck className="w-8 h-8 text-blue-300" />
              </div>
              <h4 className="text-base font-bold text-white">Electric Rickshaw #DL-04 En Route</h4>
              <p className="text-xs text-slate-400 mt-1">Passing Mall Road Intersection. 2.1 km to destination.</p>
            </div>

            {/* Simulated Controls */}
            <div className="relative z-10 bg-slate-800/90 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">NEXT TURN:</span>
                <strong className="text-white">Bear right onto Timarpur Main Road in 400m</strong>
              </div>
              <button
                onClick={() => setActiveStep(activeStep < 4 ? activeStep + 1 : 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                Simulate Next Milestone
              </button>
            </div>
          </div>

          {/* Turn-by-Turn Waypoint List (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Route Waypoint Manifest</h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200">
              {routeSteps.map((step) => {
                const isCompleted = step.status === "done";
                const isActive = step.status === "active";
                return (
                  <div key={step.num} className="relative flex items-start gap-4 text-xs">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-white z-10 ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-blue-600 text-white animate-pulse"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {step.num}
                    </div>

                    <div className="flex-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900">{step.title}</h5>
                        <span className="text-[10px] text-slate-400">{step.eta}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{step.address}</p>
                      <p className="text-slate-500 italic text-[10px] pt-1">{step.notes}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
