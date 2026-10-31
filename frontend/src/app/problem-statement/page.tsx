import Link from "next/link";
import { AlertTriangle, TrendingDown, Flame, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function ProblemStatementPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Problem Statement" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
          The National Crisis
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          The Paradox of Indian Food Waste & Urban Hunger
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          India stands at a tragic crossroads: while millions of families face daily caloric deficiencies,
          billions of rupees worth of cooked feast meals and fresh harvests are dumped into municipal landfills every year.
        </p>
      </div>

      {/* Three Startling Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-red-50/50 border border-red-200 p-8 rounded-2xl">
          <div className="text-4xl font-extrabold text-red-600 mb-2">68.7M MT</div>
          <h4 className="text-base font-bold text-slate-900 mb-2">Food Discarded Annually</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            According to the UNEP Food Waste Index, India wastes approximately 50-68 kilograms of food per capita
            every year, largely concentrated in hospitality and metropolitan banquets.
          </p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-2xl">
          <div className="text-4xl font-extrabold text-amber-600 mb-2">194.4M</div>
          <h4 className="text-base font-bold text-slate-900 mb-2">Undernourished Citizens</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            FAO State of Food Security reports reveal that India houses over 14% of the world&apos;s undernourished population,
            with child stunting remaining an acute urban challenge.
          </p>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-2xl">
          <div className="text-4xl font-extrabold text-emerald-400 mb-2">28× Methane</div>
          <h4 className="text-base font-bold text-white mb-2">Potent Greenhouse Emissions</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Decomposing food in open landfills (such as Ghazipur and Deonar) generates massive volumes of methane,
            trapping 28 times more atmospheric heat than carbon dioxide.
          </p>
        </div>
      </div>

      {/* The Core Systemic Bottlenecks */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 mb-16 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Why Traditional Food Donation Fails</h2>
        <p className="text-slate-600 text-sm max-w-2xl mb-8">
          The challenge is fundamentally logistical, not motivational. Most hotels want to donate, but encounter three critical hurdles:
        </p>

        <div className="space-y-6">
          <div className="flex gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">1. Real-Time Dispatch Window</h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                A banquet ends at 11:30 PM. Prepared food spoils within 4-6 hours if not refrigerated. Without automated
                local courier dispatch, calling individual charity homes in the middle of the night is impossible.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">2. Safety Hesitation & Liability Phobia</h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Hotel managers fear food poisoning lawsuits or reputational damage. Without an FSSAI-aligned inspection
                layer and digital signatures verifying handover conditions, managers choose to discard rather than risk donation.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">3. Mismatched Dietary Preferences & Volume</h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Delivering 500 meals to a 40-child orphanage creates secondary spoilage. Delivering non-vegetarian feast food
                to an all-vegetarian elderly shelter leads to immediate rejection. Intelligent matching is essential.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The AnnaSathi Solution Breakdown */}
      <div className="bg-brand-900 text-white rounded-3xl p-8 sm:p-12 mb-16 relative overflow-hidden">
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">How AnnaSathi 2.0 Solves This</h2>
        <p className="text-brand-200 text-sm sm:text-base max-w-2xl mb-8">
          We rebuilt food rescue from the ground up as an algorithmic, safety-certified logistics network.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-brand-800/80 p-5 rounded-xl border border-brand-700">
            <h4 className="font-bold text-white text-sm mb-1">Instant Posting</h4>
            <p className="text-xs text-brand-200 leading-relaxed">
              60-second mobile form. Donors specify dishes, cooking timestamp, and pickup window.
            </p>
          </div>
          <div className="bg-brand-800/80 p-5 rounded-xl border border-brand-700">
            <h4 className="font-bold text-white text-sm mb-1">Smart Engine</h4>
            <p className="text-xs text-brand-200 leading-relaxed">
              Matches with verified orphanages within an optimal 8km radius based on dietary preference.
            </p>
          </div>
          <div className="bg-brand-800/80 p-5 rounded-xl border border-brand-700">
            <h4 className="font-bold text-white text-sm mb-1">FSSAI Field QA</h4>
            <p className="text-xs text-brand-200 leading-relaxed">
              Certified volunteers measure temperature, seal containers, and generate QR verification tags.
            </p>
          </div>
          <div className="bg-brand-800/80 p-5 rounded-xl border border-brand-700">
            <h4 className="font-bold text-white text-sm mb-1">Zero Waste Diversion</h4>
            <p className="text-xs text-brand-200 leading-relaxed">
              Unfit human food automatically routes to Gaushalas (Tier-3) or BioCNG digesters (Tier-4).
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-700 flex flex-wrap gap-4 items-center justify-between">
          <span className="text-xs text-brand-200">
            Empowered by the Good Samaritan Legal Framework & Central Directorate
          </span>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-900 font-bold text-xs rounded-xl hover:bg-brand-50 transition"
          >
            <span>Explore Technical Architecture</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
