import Link from "next/link";
import Logo from "../shared/Logo";
import { Leaf, ShieldCheck, Heart, ExternalLink, Lock } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="white" size="lg" href="/" />
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              India&apos;s intelligent surplus food redistribution infrastructure. Connecting commercial kitchens,
              verified orphanages, animal shelters, and bio-energy converters to eliminate food waste and urban hunger.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-brand-400 bg-brand-950/60 border border-brand-800/60 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>FSSAI Safety Aligned</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>Zero Landfill Policy</span>
              </div>
            </div>
          </div>

          {/* Public Pages */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Explore AnnaSathi
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-brand-400 transition">About the Initiative</Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-brand-400 transition">How It Works</Link>
              </li>
              <li>
                <Link href="/food-trace" className="hover:text-brand-400 transition">FoodTrace QR Verification</Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-brand-400 transition">Impact & ESG Analytics</Link>
              </li>
              <li>
                <Link href="/volunteer-program" className="hover:text-brand-400 transition">Volunteer Fleet</Link>
              </li>
              <li>
                <Link href="/sustainability" className="hover:text-brand-400 transition">Sustainability & Carbon</Link>
              </li>
            </ul>
          </div>

          {/* Roles & Portals */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Stakeholder Roles
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/our-roles" className="hover:text-brand-400 transition">All 6 Ecosystem Roles</Link>
              </li>
              <li>
                <Link href="/donor/dashboard" className="hover:text-brand-400 transition">Donor Portal</Link>
              </li>
              <li>
                <Link href="/volunteer/dashboard" className="hover:text-brand-400 transition">Volunteer Mission Control</Link>
              </li>
              <li>
                <Link href="/recipient/dashboard" className="hover:text-brand-400 transition">Shelter & NGO Portal</Link>
              </li>
              <li>
                <Link href="/animal-welfare/dashboard" className="hover:text-brand-400 transition">Animal Welfare Portal</Link>
              </li>
              <li>
                <Link href="/processor/dashboard" className="hover:text-brand-400 transition">BioCNG & Compost Units</Link>
              </li>
            </ul>
          </div>

          {/* Community & Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Programs & Trust
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/volunteer-program" className="hover:text-brand-400 transition">Volunteer Programme</Link>
              </li>
              <li>
                <Link href="/sustainability" className="hover:text-brand-400 transition">Sustainability & Carbon</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand-400 transition">Help & FAQs</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-400 transition">Emergency Rescue Hotline</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-brand-400 transition">Join as a Food Partner</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Discreet Admin Access */}
        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 AnnaSathi Foundation. Built for national surplus food recovery.</p>

          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400">Good Samaritan Act Compliant</span>
            <span className="hover:text-slate-400">Privacy & Terms</span>
            
            {/* Discreet Admin Portal Entry */}
            <Link
              href="/admin/login"
              className="flex items-center gap-1 text-slate-600 hover:text-slate-400 transition py-1 px-2 rounded hover:bg-slate-800"
              title="Restricted Staff & Admin Directorate Login"
            >
              <Lock className="w-3 h-3" />
              <span>Admin Directorate</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
