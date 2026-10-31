"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Logo from "../shared/Logo";
import {
  Menu,
  X,
  Sparkles,
  Search,
  ChevronDown,
  LogIn,
  LogOut,
  Heart,
  LayoutDashboard,
  ShieldCheck,
  Compass,
  FileText,
  HelpCircle,
  Mail,
  Leaf,
  Users,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export default function PublicNavbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreDropdownOpen, setExploreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExploreDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExploreDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const roleStr = profile?.role as string | undefined;
  const dashboardHref =
    roleStr === "inspector"
      ? "/inspector/dashboard"
      : roleStr === "recipient"
      ? "/recipient/dashboard"
      : roleStr === "volunteer"
      ? "/volunteer/dashboard"
      : roleStr === "admin"
      ? "/admin/dashboard"
      : roleStr === "processor"
      ? "/processor/dashboard"
      : "/donor/dashboard";

  // Primary direct links on desktop
  const primaryLinks = [
    { label: "How It Works", href: "/how-it-works" },
    { label: "FoodTrace", href: "/food-trace" },
    { label: "Impact", href: "/impact" },
    { label: "Roles", href: "/our-roles" },
  ];

  // Secondary items in the "Explore" dropdown
  const secondaryLinks = [
    { label: "About AnnaSathi", href: "/about", icon: Compass, desc: "Our mission, founding story and ethics" },
    { label: "Volunteer Program", href: "/volunteer-program", icon: Users, desc: "Join our rescue transport fleet" },
    { label: "Sustainability", href: "/sustainability", icon: Leaf, desc: "Carbon diversion & ESG analytics" },
    { label: "FAQ & Standards", href: "/faq", icon: HelpCircle, desc: "FSSAI safety compliance & tiers" },
    { label: "Contact Directorate", href: "/contact", icon: Mail, desc: "Direct hotline and partner support" },
  ];

  const isExploreActive = secondaryLinks.some((item) => pathname === item.href);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Top announcement strip */}
      <div className="bg-brand-900 text-brand-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span className="truncate">
          AnnaSathi Network: FSSAI-aligned food recovery platform connecting donors, charities, and eco-processors
        </span>
        <Link
          href="/food-trace"
          className="underline hover:text-white ml-1.5 text-xs font-semibold shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
        >
          Live Tracker →
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Logo href="/" size="md" />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {primaryLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                    isActive
                      ? "text-brand-800 bg-brand-50/90 font-bold after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:bg-brand-600 after:rounded-full"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Explore Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setExploreDropdownOpen((prev) => !prev)}
                aria-expanded={exploreDropdownOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                  isExploreActive || exploreDropdownOpen
                    ? "text-brand-800 bg-brand-50 font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <span>Explore</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    exploreDropdownOpen ? "rotate-180 text-brand-600" : "text-slate-400"
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {exploreDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                  role="menu"
                >
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Platform & Community
                  </div>
                  <div className="py-1">
                    {secondaryLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setExploreDropdownOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                            isActive
                              ? "bg-brand-50 text-brand-800 font-semibold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isActive ? "bg-brand-200/60 text-brand-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">{item.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Action Buttons Cluster */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/food-trace"
              className="btn-interactive btn-outline px-3 py-2 text-xs font-semibold gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>Track Batch</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <Link
                  href={dashboardHref}
                  className="btn-interactive btn-secondary px-3.5 py-2 text-xs font-semibold gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="btn-interactive btn-ghost p-2 text-slate-500 hover:text-red-600 rounded-xl"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="btn-interactive btn-ghost px-3 py-2 text-xs font-semibold text-slate-700 hover:text-brand-700"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/register"
                  className="btn-interactive btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Join Network</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <Link
                href={dashboardHref}
                className="btn-interactive btn-outline px-2.5 py-1.5 text-xs font-bold text-brand-700 border-brand-200 bg-brand-50"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-interactive btn-outline px-2.5 py-1.5 text-xs font-bold text-slate-700"
              >
                Sign In
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay and Panel */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[calc(4rem+29px)] bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 top-[calc(4rem+29px)] max-h-[calc(100vh-6rem)] overflow-y-auto bg-white border-b border-slate-200 p-5 shadow-2xl z-50 lg:hidden space-y-5"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Core Operations
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {primaryLinks.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Explore AnnaSathi
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {secondaryLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isActive
                          ? "bg-brand-50 text-brand-800 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/food-trace"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-interactive btn-outline w-full py-3 text-xs font-semibold gap-2"
              >
                <Search className="w-4 h-4 text-brand-600" />
                <span>Track Batch in FoodTrace</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-interactive btn-primary w-full py-3 text-xs font-bold gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="btn-interactive btn-danger w-full py-2.5 text-xs font-bold"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-interactive btn-outline py-2.5 text-xs font-bold text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-interactive btn-primary py-2.5 text-xs font-bold text-center"
                  >
                    Join Network
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
