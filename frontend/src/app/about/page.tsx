import Link from "next/link";
import { Leaf, Award, ShieldCheck, Heart, Users, CheckCircle2, ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "About AnnaSathi" }]} />

      {/* Hero Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Our Story & Vision
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          Eliminating Surplus Food Waste in India Through Technology & Dignity
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          AnnaSathi (meaning &ldquo;Companion of Food&rdquo;) was established with a singular objective:
          ensuring that no edible food in urban commercial establishments ever meets a trash bin while a single person
          sleeps hungry within a 15-kilometer radius.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Dignified Distribution</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We reject the notion of &ldquo;leftover handouts.&rdquo; Surplus meals rescued from high-end banquets and corporate
            pantries are treated with the highest sanitary dignity, vacuum or thermal packed, and delivered directly
            into shelter dining halls.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Strict Food Safety Protocol</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Aligned with Food Safety and Standards Authority of India (FSSAI) guidelines, our certified field volunteers
            test temperature, visual freshness, and cooking timestamp before any consignment is authorized for transit.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Leaf className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">True Circular Diversion</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            If food falls outside the safe human consumption threshold, it is automatically diverted to registered
            animal sanctuaries or industrial BioCNG digesters. Zero organic waste reaches methane-spewing municipal landfills.
          </p>
        </div>
      </div>

      {/* Founding Principles Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 mb-16 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Our Guiding Operational Principles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">30-Minute Dispatch Window</h4>
              <p className="text-sm text-slate-600 mt-1">
                Cooked food degrades rapidly in tropical climates. Our volunteer dispatch network activates within 30 minutes
                of donor notification using GPS route clustering.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Good Samaritan Protection</h4>
              <p className="text-sm text-slate-600 mt-1">
                We educate and shield our donors under the Food Safety & Standards Regulations 2019, removing fear of liability
                for bona fide surplus contributions.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Cryptographic Traceability</h4>
              <p className="text-sm text-slate-600 mt-1">
                Every package is marked with a digital QR code that captures the source kitchen, inspector badge, ambient
                temperature readings, and recipient receipt verification.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Carbon Footprint Accountability</h4>
              <p className="text-sm text-slate-600 mt-1">
                Every kilogram redirected generates mathematically verified carbon offset metrics compliant with global ESG
                reporting frameworks (GHG Protocol Scope 3).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-brand-950">Curious how our matching technology functions?</h3>
          <p className="text-sm text-brand-800 mt-1">
            See how verified surplus reaches shelters in under 90 minutes.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/how-it-works"
            className="btn-interactive btn-primary px-5 py-2.5 text-xs font-bold"
          >
            How It Works
          </Link>
          <Link
            href="/food-trace"
            className="btn-interactive btn-outline px-5 py-2.5 text-xs font-bold"
          >
            Trace Consignment
          </Link>
        </div>
      </div>
    </div>
  );
}
