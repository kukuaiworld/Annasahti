import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  Award,
  Zap,
  CheckCircle2,
  Heart,
  ArrowRight,
  Star,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { INITIAL_VOLUNTEER_USERS } from "@/data/demoData";

export default function VolunteerProgramPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Volunteer Programme" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          The Ground Rescue Movement
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          Become a City Food Rescue Champion
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          AnnaSathi volunteers are everyday citizens, students, and electric vehicle owners who bridge the
          crucial last-mile gap between surplus kitchen banquet halls and neighborhood orphanages.
        </p>
      </div>

      {/* Fleet Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Electric Rickshaws & Minivans</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ideal for large wedding feast consignments (80kg - 300kg). Rickshaw drivers receive subsidized battery
            charging credits and mission honorariums.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Two-Wheelers & E-Bikes</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Equipped with thermal-insulated backpacks to transport bakery loaves, produce boxes, or 20-50 meal packs
            through congested urban alleys.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Certified Food Safety Field Leads</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Volunteers trained in basic FSSAI hygiene checklists, infrared temperature probing, and digital QR code
            handover verification.
          </p>
        </div>
      </div>

      {/* Hall of Fame / Leaderboard Preview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 mb-16 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Leaderboard Highlights</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Our Top Monthly Heroes</h2>
          </div>
          <Link
            href="/volunteer/leaderboard"
            className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
          >
            <span>View Full Live Leaderboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_VOLUNTEER_USERS.slice(0, 3).map((v) => (
            <div key={v.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.avatar} alt={v.name} className="w-14 h-14 rounded-full object-cover border-2 border-brand-500" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{v.name}</h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded">
                    Rank #{v.rank}
                  </span>
                </div>
                <p className="text-xs text-brand-700 font-semibold">{v.city} • {v.vehicleType.replace(/_/g, " ")}</p>
                <div className="text-[11px] text-slate-500 mt-1 flex gap-3">
                  <span><strong>{v.missionsCompleted}</strong> missions</span>
                  <span><strong>{v.kgDelivered}</strong> kg rescued</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-blue-900 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Drive or Ride for AnnaSathi?</h2>
          <p className="text-blue-200 text-sm mt-2 max-w-xl">
            Choose missions based on your schedule. We provide insulated thermal bags, digital training, and verified
            Good Samaritan certificates.
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <Link
            href="/register"
            className="px-6 py-3 bg-white text-blue-900 text-xs font-bold rounded-xl hover:bg-blue-50 transition shadow"
          >
            Sign Up as Volunteer
          </Link>
          <Link
            href="/volunteer/dashboard"
            className="px-6 py-3 bg-blue-800 text-white text-xs font-semibold rounded-xl border border-blue-600 hover:bg-blue-700 transition"
          >
            Explore Dashboard Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
