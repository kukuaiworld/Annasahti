"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Droplet,
  Users,
  Award,
  TrendingUp,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Share2,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ImpactPage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const cityData: Record<string, { kg: number; meals: number; co2: number; water: number }> = {
    all: { kg: 14250, meals: 38900, co2: 34.2, water: 856000 },
    delhi: { kg: 6800, meals: 18500, co2: 16.3, water: 410000 },
    bengaluru: { kg: 4200, meals: 11400, co2: 10.1, water: 252000 },
    mumbai: { kg: 3250, meals: 9000, co2: 7.8, water: 194000 },
  };

  const currentStats = cityData[selectedCity] || cityData.all;

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Our Impact" }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ESG & Planetary Metrics
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
            Real Numbers. Quantifiable Planetary Impact.
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Every plate rescued by AnnaSathi directly eliminates municipal landfill methane, spares freshwater
            footprints, and feeds nutritious calories to vulnerable citizens.
          </p>
        </div>

        {/* City Filter */}
        <div className="shrink-0 flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold">
          {[
            { id: "all", label: "Pan India" },
            { id: "delhi", label: "Delhi NCR" },
            { id: "bengaluru", label: "Bengaluru" },
            { id: "mumbai", label: "Mumbai" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCity(c.id)}
              className={`px-3 py-2 rounded-xl transition ${
                selectedCity === c.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Big Impact Numbers Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-brand-600 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center font-bold">
              <Leaf className="w-6 h-6 text-brand-600" />
            </div>
            <span className="text-xs font-bold bg-brand-50 text-brand-800 px-2 py-0.5 rounded-full">
              +18% MoM
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {currentStats.kg.toLocaleString()} <span className="text-xl text-slate-500 font-semibold">kg</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Surplus Food Recovered</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center font-bold">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-bold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {currentStats.meals.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Nutritious Meals Served</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
              GHG Scope 3
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {currentStats.co2} <span className="text-xl text-slate-500 font-semibold">Tons</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">CO₂e Emissions Prevented</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold">
              <Droplet className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
              Water Footprint
            </span>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {(currentStats.water / 1000).toLocaleString()}{" "}
              <span className="text-xl text-slate-500 font-semibold">kL</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Embedded Water Conserved</p>
          </div>
        </div>
      </div>

      {/* Destination Breakdown Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-2">Surplus Destination Breakdown</h3>
          <p className="text-xs text-slate-500 mb-6">
            Where rescued food is directed based on our 4-Tier safety cascade
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Tier 1: Orphanages & Children Homes</span>
                <span className="text-brand-700">68% (9,690 kg)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Tier 2: Community Kitchens (Fresh Produce)</span>
                <span className="text-blue-700">14% (1,995 kg)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "14%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Tier 3: Animal Sanctuaries & Gaushalas</span>
                <span className="text-amber-700">12% (1,710 kg)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: "12%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Tier 4: BioCNG Plants & Composting Units</span>
                <span className="text-teal-700">6% (855 kg)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full" style={{ width: "6%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ESG Certificate Download Box */}
        <div className="bg-gradient-to-br from-slate-900 to-brand-950 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-900/80 border border-brand-700 text-brand-300 text-xs font-semibold mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>Audit Certified</span>
            </div>
            <h3 className="text-2xl font-black">Official ESG Carbon Offset Summary</h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed">
              Commercial hospitality donors can download quarterly verification packages ready for
              BRSR (Business Responsibility and Sustainability Reporting) and Scope 3 greenhouse accounting.
            </p>
          </div>

          <div className="pt-8">
            {downloadSuccess ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Certificate Package Downloaded (PDF + CSV)!</span>
              </div>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample ESG Compliance Report</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
