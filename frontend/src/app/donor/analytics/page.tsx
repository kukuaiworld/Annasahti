"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Leaf, Droplets, Utensils, Calendar } from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function DonorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month");

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Kitchen Waste Reduction & ESG Analytics"
        subtitle="Historical surplus metrics, diversion ratios and planetary credits"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Donor Portal", href: "/donor/dashboard" }, { label: "Impact & Analytics" }]} />

        {/* Time Filter */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">Analytics Horizon:</span>
          <div className="flex gap-2 text-xs font-semibold">
            {["week", "month", "quarter", "year"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  timeRange === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500">Gross Rescued Payload</span>
            <div className="text-3xl font-black text-slate-900">4,280 kg</div>
            <p className="text-[11px] text-emerald-600 font-bold">+14.2% higher efficiency</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500">Net Avoided CO₂ Emissions</span>
            <div className="text-3xl font-black text-emerald-700">10.27 Tons</div>
            <p className="text-[11px] text-slate-500">Equivalent to 42,000 km car travel</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold text-slate-500">Beneficiary Meals</span>
            <div className="text-3xl font-black text-purple-700">11,450 Meals</div>
            <p className="text-[11px] text-slate-500">Across 14 certified local shelters</p>
          </div>
        </div>

        {/* Simulated Bar Chart */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Surplus Diversion Trends (kg)</h3>
          
          <div className="h-48 flex items-end gap-4 sm:gap-8 pt-8 px-4 border-b border-slate-200">
            {[
              { month: "May", kg: 520, height: "45%" },
              { month: "Jun", kg: 680, height: "60%" },
              { month: "Jul", kg: 840, height: "75%" },
              { month: "Aug", kg: 720, height: "65%" },
              { month: "Sep", kg: 910, height: "82%" },
              { month: "Oct", kg: 1120, height: "100%" },
            ].map((bar) => (
              <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                  {bar.kg}kg
                </span>
                <div
                  className="w-full bg-brand-500 hover:bg-brand-600 rounded-t-lg transition-all"
                  style={{ height: bar.height }}
                />
                <span className="text-xs font-semibold text-slate-500">{bar.month}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-500 pt-2">
            <span>Peak season banquet food recovery rate: <strong>94.6%</strong></span>
            <span>Landfill avoidance rate: <strong>100%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
