import Link from "next/link";
import {
  Building2,
  Truck,
  HeartHandshake,
  PawPrint,
  Factory,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function OurRolesPage() {
  const roles = [
    {
      id: "donor",
      title: "1. Food Donors (Commercial Kitchens)",
      icon: Building2,
      subtitle: "Banquets, Wedding Caterers, 5-Star Hotels, Tech Parks & Supermarkets",
      desc: "Commercial food entities that produce high-quality surplus meals. Rather than discarding prepared food, donors post available batches on AnnaSathi in under 60 seconds.",
      features: [
        "Instant surplus listing with dietary flags (Veg, Vegan, Dairy-Free)",
        "Automated ESG Carbon Offset & Water Conservation Certificate downloads",
        "Full Good Samaritan legal liability immunity logging",
        "Historical donation analytics and waste reduction insights",
      ],
      portalUrl: "/donor/dashboard",
      color: "border-emerald-200 bg-emerald-50 text-emerald-800",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    {
      id: "volunteer",
      title: "2. Volunteer Couriers & Rapid Field Fleet",
      icon: Truck,
      subtitle: "Electric Rickshaws, Two-Wheeler Couriers & Community Volunteers",
      desc: "The heartbeat of AnnaSathi. Volunteers receive automated dispatch notifications, arrive with thermal insulated bags, inspect temperature, and carry out deliveries.",
      features: [
        "Turn-by-turn GIS route navigation with multiple pickup/drop stops",
        "In-app digital food safety QA logging (temp readings & visual check)",
        "Gamified Karma points, digital badges, and city-wide leaderboards",
        "Flexible volunteering: accept missions whenever you have 30 spare minutes",
      ],
      portalUrl: "/volunteer/dashboard",
      color: "border-blue-200 bg-blue-50 text-blue-800",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    {
      id: "recipient",
      title: "3. Recipient NGOs & Shelters",
      icon: HeartHandshake,
      subtitle: "Verified Orphanages, Old-Age Homes, Night Shelters & Slum Kitchens",
      desc: "Organizations providing care and shelter to vulnerable populations. Shelters register their resident headcounts and dietary rules to automatically receive matching hot meals.",
      features: [
        "Post meal requirement tickets with custom urgency rankings",
        "QR code arrival verification to ensure zero unhygienic food delivery",
        "Daily food inventory ledger and dietary preference filters",
        "Save substantial grocery budgets to redirect into healthcare & education",
      ],
      portalUrl: "/recipient/dashboard",
      color: "border-purple-200 bg-purple-50 text-purple-800",
      btnClass: "bg-purple-600 hover:bg-purple-700 text-white",
    },
    {
      id: "animal-welfare",
      title: "4. Animal Welfare & Sanctuaries",
      icon: PawPrint,
      subtitle: "Gaushalas, Stray Dog Feeding NGOs & Wildlife Sanctuaries",
      desc: "Surplus produce trimmings, stale wholesome bakery items, and hotel buffet leftovers that have passed the 6-hour human dining window are safely routed to animal shelters.",
      features: [
        "Receive Tier-3 fresh vegetable trimmings, grain mash & safe broth",
        "Nutritional safety screening (strictly excluding toxic onions, garlic, spices)",
        "Daily feed intake logs and shelter capacity tracking",
        "Drastically reduces animal shelter fodder procurement costs",
      ],
      portalUrl: "/animal-welfare/dashboard",
      color: "border-amber-200 bg-amber-50 text-amber-900",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    {
      id: "processor",
      title: "5. Processing & Bio-Energy Partners",
      icon: Factory,
      subtitle: "BioCNG Digestion Facilities & Commercial Vermicomposting Units",
      desc: "When organic waste has begun fermenting or is spoiled, it enters Tier-4 industrial processing to generate renewable bio-methane gas and nutrient-dense organic fertilizer.",
      features: [
        "Log incoming feedstock batches with weight measurements",
        "Monitor anaerobic digestion days, fermentation temperatures & gas yields",
        "Generate renewable BioCNG energy (kWh) and vermicompost kilograms",
        "Ensures absolute 100% circular diversion from open city landfills",
      ],
      portalUrl: "/processor/dashboard",
      color: "border-teal-200 bg-teal-50 text-teal-800",
      btnClass: "bg-teal-600 hover:bg-teal-700 text-white",
    },
    {
      id: "admin",
      title: "6. Central Admin & Safety Directorate",
      icon: ShieldCheck,
      subtitle: "FSSAI Safety Officers, City Dispatch Directors & System Auditors",
      desc: "Independent administrative portal overseeing citywide network operations, verifying new donor/NGO licenses, supervising algorithm matches, and inspecting audit trails.",
      features: [
        "KYC & FSSAI verification of registered restaurants and non-profits",
        "Live algorithm matching engine controls and manual overrides",
        "Comprehensive food diversion audit logs and tamper-evident timestamps",
        "City-by-city disaster relief food redistribution coordination",
      ],
      portalUrl: "/admin/login",
      color: "border-slate-300 bg-slate-100 text-slate-800",
      btnClass: "bg-slate-800 hover:bg-black text-white",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Our Roles" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          Stakeholder Architecture
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          Six Specialized Roles Powering AnnaSathi
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          AnnaSathi is not a monolithic application. It consists of six purpose-built portals, each designed
          with dedicated navigation, workflows, and tools tailored to the needs of its stakeholders.
        </p>
      </div>

      {/* Roles List */}
      <div className="space-y-8 mb-16">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm hover-card"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${role.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{role.title}</h3>
                    <p className="text-xs sm:text-sm text-brand-700 font-medium mt-0.5">{role.subtitle}</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">{role.desc}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <Link
                    href={role.portalUrl}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${role.btnClass}`}
                  >
                    <span>Open Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Capabilities</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {role.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-brand-600 to-emerald-700 text-white rounded-3xl p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Join Your Corresponding Role?</h2>
        <p className="text-brand-100 text-sm mt-2 max-w-xl mx-auto">
          Create an account today to access your role dashboard and begin rescuing food in your city.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-white text-brand-800 text-xs font-bold rounded-xl hover:bg-brand-50 transition shadow"
          >
            Register Now
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-brand-800 text-white text-xs font-semibold rounded-xl border border-brand-500 hover:bg-brand-900 transition"
          >
            Sign In to Existing Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
