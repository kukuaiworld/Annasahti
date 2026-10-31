"use client";

import { useState } from "react";
import { Trophy, Award, Zap, Star, ShieldCheck, Heart, Medal } from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { INITIAL_VOLUNTEER_USERS } from "@/data/demoData";

export default function VolunteerLeaderboardPage() {
  const [selectedCity, setSelectedCity] = useState("all");

  const volunteers = INITIAL_VOLUNTEER_USERS.filter((v) =>
    selectedCity === "all" ? true : v.city.toLowerCase().includes(selectedCity)
  );

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="City Courier Leaderboard & Hall of Fame"
        subtitle="Recognizing the top field heroes rescuing surplus food every day"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "Leaderboard" }]} />

        {/* City Filter */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">Filter Region:</span>
          <div className="flex gap-1.5 text-xs font-semibold">
            {[
              { id: "all", label: "National" },
              { id: "delhi", label: "Delhi NCR" },
              { id: "bengaluru", label: "Bengaluru" },
              { id: "mumbai", label: "Mumbai" },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCity(c.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedCity === c.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Highlight (Top 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {volunteers.slice(0, 3).map((v, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={v.id}
                className={`p-6 rounded-3xl border text-center space-y-3 relative overflow-hidden transition ${
                  isFirst
                    ? "bg-gradient-to-b from-amber-50 to-white border-amber-300 shadow-md ring-2 ring-amber-400/30"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs mx-auto mb-1 text-white bg-slate-900">
                  #{v.rank}
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.avatar}
                  alt={v.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-brand-500 shadow-sm"
                />

                <div>
                  <h4 className="font-bold text-slate-900 text-base">{v.name}</h4>
                  <p className="text-xs text-blue-700 font-semibold">{v.city} • {v.vehicleType.replace(/_/g, " ")}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1 border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Missions:</span>
                    <span className="font-bold text-slate-900">{v.missionsCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivered:</span>
                    <span className="font-bold text-emerald-700">{v.kgDelivered} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Karma Points:</span>
                    <span className="font-black text-amber-600">{v.points}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Full Courier Rankings</h3>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Courier Hero</th>
                <th className="py-3 px-4">City & Fleet</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Missions</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {volunteers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-black text-slate-900">#{v.rank}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.avatar} alt={v.name} className="w-7 h-7 rounded-full object-cover" />
                    <span>{v.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 capitalize">
                    {v.city} ({v.vehicleType.replace(/_/g, " ")})
                  </td>
                  <td className="py-3.5 px-4 font-bold text-amber-600">★ {v.rating}</td>
                  <td className="py-3.5 px-4">{v.missionsCompleted} completed</td>
                  <td className="py-3.5 px-4 text-right font-black text-amber-600">{v.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
