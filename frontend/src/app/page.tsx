import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  HeartHandshake,
  QrCode,
  Leaf,
  Users,
  Building,
  Award,
  ChevronRight,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";
import { TESTIMONIALS } from "@/data/demoData";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20">
      {/* 1. Hero Section - ATTRACTIVE IMAGE-FREE DESIGN (Requirement 2) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-emerald-50/40 to-white pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-emerald-100/60">
        <div className="absolute inset-0 bg-[radial-gradient(#16a34a_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-300 text-brand-900 text-xs md:text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
            <span>FSSAI-Aligned Food Rescue Network</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
            <span className="text-brand-700">Zero Landfill Guarantee</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Turning Commercial Surplus Food Into{" "}
            <span className="bg-gradient-to-r from-brand-600 to-emerald-600 bg-clip-text text-transparent">
              Dignified Daily Meals
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AnnaSathi 2.0 connects hotels, wedding caterers and corporate kitchens with nearby orphanages,
            shelters, gaushalas and clean bio-energy processors through algorithmic routing and real-time safety inspection.
          </p>

          {/* CTA Button Group */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/donor/new-donation"
              className="btn-interactive btn-primary w-full sm:w-auto px-6 py-3.5 text-sm font-bold gap-2"
            >
              <span>Donate Surplus Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/food-trace"
              className="btn-interactive btn-outline w-full sm:w-auto px-6 py-3.5 text-sm font-bold gap-2"
            >
              <QrCode className="w-4 h-4 text-brand-600" />
              <span>Trace Food Batch</span>
            </Link>
          </div>

          {/* Quick Highlight Stats Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="card-interactive bg-white/90 backdrop-blur p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-700">14,250+ kg</div>
              <p className="text-xs text-slate-500 font-medium mt-1">Surplus Food Rescued</p>
            </div>
            <div className="card-interactive bg-white/90 backdrop-blur p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-700">38,900+</div>
              <p className="text-xs text-slate-500 font-medium mt-1">Warm Meals Served</p>
            </div>
            <div className="card-interactive bg-white/90 backdrop-blur p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-700">34.2 Tons</div>
              <p className="text-xs text-slate-500 font-medium mt-1">CO₂ Emissions Diverted</p>
            </div>
            <div className="card-interactive bg-white/90 backdrop-blur p-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-700">100%</div>
              <p className="text-xs text-slate-500 font-medium mt-1">Diversion from Landfills</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Project Introduction Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
                The AnnaSathi Mission
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Bridging the Chasm Between Urban Waste and Hidden Hunger
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Every night in India&apos;s urban centers, thousands of kilograms of wholesome, freshly prepared food
                from banquets, corporate canteens, and restaurant kitchens are thrown into disposal bins. Simultaneously,
                unfunded orphanages, night shelters, and community kitchens struggle daily to feed their residents.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                AnnaSathi provides an end-to-end technological bridge. Using GIS radius-based allocation, certified
                volunteer courier dispatch, and multi-tier food diversion, we ensure that zero food is wasted.
              </p>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>30-minute rapid dispatch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>Digital temperature & hygiene logging</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>Good Samaritan protection</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-brand-50/70 p-6 rounded-xl border border-brand-200 space-y-4 text-center">
              <div className="w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Learn the Full Story</h3>
              <p className="text-xs text-slate-600">
                Discover our founding vision, technical methodology, and the crisis we are solving.
              </p>
              <div className="pt-2">
                <Link
                  href="/about"
                  className="btn-interactive btn-primary w-full py-2.5 px-4 text-xs font-bold"
                >
                  Read About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Small Previews of Main Features (Requirement 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
            System Highlights
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Engineered for Precision, Safety, and Trust
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Explore dedicated modules powering our zero-waste pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Rapid Volunteer Transport */}
          <div className="card-interactive bg-white p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Rapid Volunteer Transport</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connects trained volunteer couriers with thermal insulated storage to collect food and deliver it
                to vetted recipient shelters in under 45 minutes.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/volunteer-program"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900"
              >
                <span>Volunteer Program</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature 2: FoodTrace QR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">FoodTrace Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan unique digital QR tags generated for every food pickup. Monitor storage temperature, dispatch times,
                and digital volunteer signatures in real-time.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/food-trace"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <span>Test Live FoodTrace</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature 3: Multi-Tier Safety */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">4-Tier Zero Waste Cascade</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Food is tested by certified inspectors. High quality feeds orphanages; secondary items feed gaushalas;
                decomposed scraps produce BioCNG. Nothing is dumped.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                <span>View How It Works</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NGO and Community Photographs Section (Lower Section - Requirement 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
            Ground Reality & Compassion
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Faces of the Community We Serve
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real impact across partner orphanages, municipal shelters, and volunteer electric vehicle fleets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative overflow-hidden rounded-2xl shadow-sm border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80"
              alt="Children having dinner at shelter"
              className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[11px] font-bold text-emerald-300">Asha Kiran Orphanage</span>
              <p className="text-xs font-medium">120 girls receiving hot meals daily</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl shadow-sm border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80"
              alt="Volunteers packing food"
              className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[11px] font-bold text-brand-300">Volunteer Rapid Squad</span>
              <p className="text-xs font-medium">Insulated thermal food transit</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl shadow-sm border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb7?auto=format&fit=crop&w=600&q=80"
              alt="Community distribution kitchen"
              className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[11px] font-bold text-amber-300">Prerna Community Kitchen</span>
              <p className="text-xs font-medium">Serving destitute migrant workers</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl shadow-sm border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80"
              alt="Animal sanctuary receiving fresh feed"
              className="w-full h-56 object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[11px] font-bold text-teal-300">Shri Krishna Gaushala</span>
              <p className="text-xs font-medium">Tier-3 vegetable trimmings diverted</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/impact"
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg border border-brand-200 transition"
          >
            <span>View Full Impact Gallery & Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 5. Role Introduction Cards (6 Distinct Portals - Requirement 2 & 3) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
            Integrated Ecosystem
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Six Roles, One Harmonious Network
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Every user group accesses a dedicated portal tailored to their operational responsibilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Donor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Food Donors</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hotels, Caterers, Corporate Cafeterias</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Post surplus food in 60 seconds with expiry windows and allergens. Download ESG compliance certificates
                and track deliveries.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/donor/dashboard"
                className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
              >
                <span>Enter Donor Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-slate-400">/donor/*</span>
            </div>
          </div>

          {/* 2. Volunteer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Volunteers & Couriers</h3>
              <p className="text-xs text-slate-500 mt-0.5">EV Drivers, Two-Wheelers, Field Heroes</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Accept rescue missions on interactive map routes, log safety temperatures, earn karma points, and climb
                city leaderboards.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/volunteer/dashboard"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                <span>Enter Volunteer Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-slate-400">/volunteer/*</span>
            </div>
          </div>

          {/* 3. Recipient */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Recipient Shelters</h3>
              <p className="text-xs text-slate-500 mt-0.5">Orphanages, Old Age Homes, Slum Kitchens</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Post meal requirements, verify incoming food delivery temperature via QR scans, and feed community members
                with dignity.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/recipient/dashboard"
                className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <span>Enter Recipient Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-slate-400">/recipient/*</span>
            </div>
          </div>

          {/* 4. Animal Welfare */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Animal Welfare Shelters</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gaushalas, Stray Dog Rescues, Sanctuaries</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Receive certified Tier-3 produce surplus and grain mash unsuitable for human timings, maintaining feed
                nutritional logs.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/animal-welfare/dashboard"
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
              >
                <span>Enter Animal Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-slate-400">/animal-welfare/*</span>
            </div>
          </div>

          {/* 5. Processing Partner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Processing & Bio-Energy</h3>
              <p className="text-xs text-slate-500 mt-0.5">BioCNG Plants & Industrial Vermicompost</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Transform decomposed organic scraps (Tier-4) into clean biogas energy, organic manure, and carbon credits
                for the circular economy.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/processor/dashboard"
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <span>Enter Processor Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-slate-400">/processor/*</span>
            </div>
          </div>

          {/* 6. Admin Portal */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover-card">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Admin Directorate</h3>
              <p className="text-xs text-slate-500 mt-0.5">Central Network Oversight & Safety QA</p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Oversee FSSAI compliance, approve NGO onboarding verifications, manage algorithmic matching triggers,
                and review audit logs.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Link
                href="/admin/login"
                className="text-xs font-bold text-slate-800 hover:text-black flex items-center gap-1"
              >
                <span>Staff Admin Access</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-slate-400">/admin/*</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/our-roles"
            className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-900"
          >
            <span>Learn More About Ecosystem Responsibilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 6. Testimonials Section (Requirement 2) */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
              Voices of Change
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
              Stories From Our Ground Partners
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-brand-300" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-brand-700 font-medium">{t.role}</p>
                    <p className="text-[10px] text-slate-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Call To Action Banner (Requirement 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-emerald-800 to-brand-900 p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Ready to Zero Out Food Waste in Your City?
          </h2>
          <p className="text-brand-100 text-sm sm:text-base mt-4 max-w-xl mx-auto">
            Join over 450+ verified businesses, volunteers, and shelters actively rescuing food every single day.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-interactive btn-outline w-full sm:w-auto px-6 py-3 text-brand-900 bg-white hover:bg-brand-50 text-sm font-bold border-0 shadow-md"
            >
              Register Your Organization
            </Link>
            <Link
              href="/volunteer-program"
              className="btn-interactive w-full sm:w-auto px-6 py-3 bg-brand-800/90 hover:bg-brand-800 text-white text-sm font-semibold rounded-xl border border-brand-500/50 shadow-sm"
            >
              Sign Up as Volunteer Courier
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
