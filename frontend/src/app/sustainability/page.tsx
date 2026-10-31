import Link from "next/link";
import { Leaf, Droplets, Wind, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function SustainabilityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Sustainability & Climate" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Planetary Circularity
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          Zero-Waste Bio-Circular Economy for India
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Food waste is not merely a humanitarian dilemma; it is one of the single largest drivers of municipal methane
          emissions and squandered freshwater in the developing world.
        </p>
      </div>

      {/* 3 Core Environmental Angles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <Wind className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Methane Landfill Mitigation</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            When food rots anaerobically under garbage heaps, it releases methane (CH₄). Diverting 14,000+ kg of food
            via AnnaSathi has neutralized the equivalent of driving an average diesel car over 140,000 kilometers.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
            <Droplets className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Virtual Water Footprint</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Producing 1 kilogram of polished rice consumes over 2,500 liters of groundwater; 1 kg of dairy cheese
            consumes over 5,000 liters. Rescuing cooked meals prevents this squandered irrigation footprint.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">BioCNG & Clean Energy</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Through our Tier-4 processing partners, decomposed scraps are fed into anaerobic biodigesters,
            yielding clean compressed biogas that powers local municipal transport fleets.
          </p>
        </div>
      </div>

      {/* Corporate ESG Alignment */}
      <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-12 mb-16 relative overflow-hidden">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Empowering Corporate ESG & BRSR Compliance</h2>
        <p className="text-emerald-200 text-sm sm:text-base max-w-2xl mb-8">
          SEBI and international sustainability standards require listed corporations to report Scope 3 supply chain
          emissions and waste diversion. AnnaSathi equips corporate cafeterias with automated audit packages.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-emerald-900/60 p-5 rounded-2xl border border-emerald-800">
            <h4 className="font-bold text-emerald-300 text-sm mb-1">GHG Protocol Scope 3</h4>
            <p className="text-xs text-emerald-100">
              Precise emission factor calculations based on food type and avoided landfill decomposition.
            </p>
          </div>
          <div className="bg-emerald-900/60 p-5 rounded-2xl border border-emerald-800">
            <h4 className="font-bold text-emerald-300 text-sm mb-1">UN SDG #2 & #12</h4>
            <p className="text-xs text-emerald-100">
              Measurable progress toward Zero Hunger (SDG 2) and Responsible Consumption & Production (SDG 12).
            </p>
          </div>
          <div className="bg-emerald-900/60 p-5 rounded-2xl border border-emerald-800">
            <h4 className="font-bold text-emerald-300 text-sm mb-1">Cryptographic Badges</h4>
            <p className="text-xs text-emerald-100">
              Embed live Zero Food Waste badges directly on your corporate sustainability webpage.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-emerald-800 flex justify-between items-center flex-wrap gap-4">
          <span className="text-xs text-emerald-300">Certified by AnnaSathi Sustainability Directorate</span>
          <Link
            href="/impact"
            className="px-5 py-2.5 bg-white text-emerald-950 font-bold text-xs rounded-xl hover:bg-emerald-50 transition"
          >
            Explore Impact Data
          </Link>
        </div>
      </div>
    </div>
  );
}
