"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "../shared/Logo";
import {
  Menu,
  X,
  Sparkles,
  Search,
  ShieldCheck,
  ChevronDown,
  User,
  LogIn,
  Heart,
  Leaf,
} from "lucide-react";

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rolesDropdown, setRolesDropdown] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Problem", href: "/problem-statement" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Roles", href: "/our-roles" },
    { label: "Smart Matching", href: "/smart-matching" },
    { label: "FoodTrace", href: "/food-trace" },
    { label: "Impact", href: "/impact" },
    { label: "Volunteer", href: "/volunteer-program" },
    { label: "Sustainability", href: "/sustainability" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top emergency announcement bar */}
      <div className="bg-brand-900 text-brand-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        <span>
          AnnaSathi Active Network: <strong>1,450+ kg</strong> surplus rescued in the last 24 hours across Delhi NCR, Bengaluru & Mumbai
        </span>
        <Link href="/food-trace" className="underline hover:text-white ml-2 text-xs font-semibold">
          Live Tracker →
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo href="/" size="md" />

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-brand-700 bg-brand-50 font-semibold"
                      : "text-slate-600 hover:text-brand-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/food-trace"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Food</span>
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm hover:shadow rounded-lg transition"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Join Network</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex xl:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-2.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 rounded-lg"
            >
              Sign In
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-1 shadow-lg">
          <div className="grid grid-cols-2 gap-1 mb-4">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? "text-brand-700 bg-brand-50 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 px-4 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
            >
              Register Account
            </Link>
            <Link
              href="/food-trace"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 px-4 text-sm font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200"
            >
              Trace Food Batch (Live QR)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
