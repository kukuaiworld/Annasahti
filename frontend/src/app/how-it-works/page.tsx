import Link from "next/link";
import {
  UploadCloud,
  Cpu,
  ShieldCheck,
  Truck,
  CheckCircle2,
  FileCheck2,
  Leaf,
  RefreshCcw,
  QrCode,
  ArrowRight,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function HowItWorksPage() {
  const steps = [
    {
      num: "01",
      icon: UploadCloud,
      title: "Surplus Listing & Pickup Broadcast",
      desc: "Commercial caterers, banquets, or corporate cafeterias post leftover quantities, food categories (veg/non-veg), preparation times, and available pickup windows in under 60 seconds.",
      color: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      num: "02",
      icon: Cpu,
      title: "Recipient Requirement & Radius Allocation",
      desc: "The AnnaSathi engine analyzes GIS coordinates, recipient dietary compatibility, requested meal volumes, and shelter urgency rankings to calculate optimal allocation without human delay.",
      color: "border-purple-200 bg-purple-50 text-purple-700",
    },
    {
      num: "03",
      icon: ShieldCheck,
      title: "FSSAI Safety Inspection & 4-Tier Grading",
      desc: "A certified volunteer or courier arrives with digital temperature sensors. Storage temperatures (>60°C hot or <5°C cold), smell, and visual hygiene are recorded to assign a verified safety tier.",
      color: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      num: "04",
      icon: Truck,
      title: "Cold-Chain / Insulated Rapid Transit",
      desc: "Electric rickshaws and two-wheelers fitted with insulated thermal containers execute rapid point-to-point transit, minimizing time in the microbial danger zone (20°C to 50°C).",
      color: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      num: "05",
      icon: QrCode,
      title: "QR Code Handshake & Digital Verification",
      desc: "The recipient shelter scans the physical QR batch tag to confirm arrival temperature, verify donor authenticity, and close the mission loop with zero paperwork.",
      color: "border-teal-200 bg-teal-50 text-teal-700",
    },
    {
      num: "06",
      icon: FileCheck2,
      title: "ESG Impact Crediting & Carbon Certificates",
      desc: "Donors instantly receive cryptographic ESG certificates logging exact kilograms saved, CO2 emission offsets, water conserved, and legal Good Samaritan immunity records.",
      color: "border-rose-200 bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "How It Works" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Step-by-Step Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          How AnnaSathi Recovers Food in Under 90 Minutes
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Our rapid response infrastructure combines GIS algorithmic routing, digital food safety verification,
          and multi-tier zero-waste diversion. Here is how the end-to-end journey unfolds.
        </p>
      </div>

      {/* 6 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover-card relative overflow-hidden"
            >
              <div className="absolute top-4 right-5 text-4xl font-extrabold text-slate-100 select-none">
                {s.num}
              </div>
              <div className="relative z-10 space-y-3">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4-Tier Zero Waste Cascade Deep Dive */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-16 shadow-xl">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
            FSSAI Protocol Hierarchy
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">
            The 4-Tier Food Safety Cascade
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            No donation is ever blindly accepted or arbitrarily discarded. Every batch is categorized
            into one of four distinct tiers based on verifiable physical metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tier 1 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                TIER 1 (Immediate Human)
              </span>
              <h4 className="font-bold text-white text-base mt-2">Fresh Cooked Feasts</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Prepared within 3-4 hours. Temp &gt;60°C or &lt;5°C. Sealed containers. Directly delivered to orphanages,
                old-age homes, and night shelters.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-emerald-300 font-semibold">
              Destination: Human Dining Halls
            </div>
          </div>

          {/* Tier 2 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-blue-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded">
                TIER 2 (Kitchen Preparation)
              </span>
              <h4 className="font-bold text-white text-base mt-2">Raw Produce & Dry Goods</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Supermarket surplus, bakery loaves, and unpeeled vegetables. Wholesome condition requiring kitchen cooking
                within 24-48 hours.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-blue-300 font-semibold">
              Destination: Community Kitchens
            </div>
          </div>

          {/* Tier 3 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded">
                TIER 3 (Animal Shelter Feed)
              </span>
              <h4 className="font-bold text-white text-base mt-2">Vegetable Peels & Breads</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Exceeded 6-hour human dining window, or unseasoned cereal grains and fruit trimmings. Inspected for safety
                (no onion/garlic for dogs).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-amber-300 font-semibold">
              Destination: Gaushalas & Stray Shelters
            </div>
          </div>

          {/* Tier 4 */}
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-teal-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded">
                TIER 4 (Bio-Energy & Compost)
              </span>
              <h4 className="font-bold text-white text-base mt-2">Decomposed Organics</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Gravies, sour milk, and rotting vegetable waste unfit for ingestion. Diverted directly to anaerobic digesters
                for BioCNG energy or vermicompost.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-teal-300 font-semibold">
              Destination: BioCNG Digesters
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Links */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Want to test the platform in action?</h3>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/food-trace"
            className="btn-interactive btn-primary px-6 py-3 text-xs font-bold"
          >
            Trace a Real Donation Batch
          </Link>
          <Link
            href="/donor/new-donation"
            className="btn-interactive btn-outline px-6 py-3 text-xs font-bold"
          >
            Post Surplus Food
          </Link>
        </div>
      </div>
    </div>
  );
}
