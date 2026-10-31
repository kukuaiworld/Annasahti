"use client";

import { Award, ShieldCheck, Zap, ThermometerSnowflake, Leaf, HeartHandshake, CheckCircle2 } from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function VolunteerBadgesPage() {
  const badges = [
    {
      id: "b1",
      title: "Hunger Hero Medal",
      category: "Milestone",
      desc: "Delivered over 1,000 kg of fresh food directly to accredited orphanages.",
      date: "August 15, 2026",
      icon: ShieldCheck,
      color: "bg-emerald-100 text-emerald-700 border-emerald-300",
      status: "Unlocked",
    },
    {
      id: "b2",
      title: "100 Missions Club",
      category: "Dedication",
      desc: "Completed 100 successful surplus pickups with 100% on-time arrival rate.",
      date: "September 22, 2026",
      icon: Award,
      color: "bg-blue-100 text-blue-700 border-blue-300",
      status: "Unlocked",
    },
    {
      id: "b3",
      title: "Cold Chain Master",
      category: "Food Safety",
      desc: "Maintained core temperatures within FSSAI safe limits for 50+ consecutive trips.",
      date: "October 10, 2026",
      icon: ThermometerSnowflake,
      color: "bg-purple-100 text-purple-700 border-purple-300",
      status: "Unlocked",
    },
    {
      id: "b4",
      title: "Zero Carbon Pioneer",
      category: "Eco-Fleet",
      desc: "Logged over 1,000 kilometers exclusively on zero-emission electric cargo vehicles.",
      date: "October 25, 2026",
      icon: Leaf,
      color: "bg-teal-100 text-teal-700 border-teal-300",
      status: "Unlocked",
    },
    {
      id: "b5",
      title: "Night Owl Guardian",
      category: "Emergency",
      desc: "Responded to 10+ late-night wedding feast calls between 11 PM and 3 AM.",
      date: "In Progress (7/10)",
      icon: Zap,
      color: "bg-amber-100 text-amber-700 border-amber-300",
      status: "Locked",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Badges, Honors & Karma Points"
        subtitle="Digital credentials recognizing your service to urban food rescue"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "Badges & Karma" }]} />

        {/* Big Karma Summary */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-amber-100 tracking-wider">
              Total Accrued Karma Points
            </span>
            <div className="text-4xl sm:text-5xl font-black">4,850 pts</div>
            <p className="text-xs text-amber-100">
              Ranked in the top 1% of volunteer couriers nationally. Eligible for municipal public service citation.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-5 py-3 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition shadow shrink-0"
          >
            Print Service Certificate
          </button>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((b) => {
            const Icon = b.icon;
            const isUnlocked = b.status === "Unlocked";
            return (
              <div
                key={b.id}
                className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 ${
                  isUnlocked ? "bg-white border-slate-200" : "bg-slate-50 border-dashed border-slate-300 opacity-60"
                }`}
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-bold ${b.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{b.category}</span>
                    <h4 className="font-bold text-slate-900 text-base">{b.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{b.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{b.date}</span>
                  <span className={`font-bold ${isUnlocked ? "text-emerald-600" : "text-slate-400"}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
