"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  BarChart3,
  Award,
  Settings,
  Leaf,
  LogOut,
  ExternalLink,
  HeartHandshake,
} from "lucide-react";

export default function DonorSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/donor/dashboard", icon: LayoutDashboard },
    { label: "Donation Ledger", href: "/donor/donations", icon: UtensilsCrossed },
    { label: "Post Surplus Food", href: "/donor/new-donation", icon: PlusCircle },
    { label: "Allocations", href: "/donor/allocations", icon: HeartHandshake },
    { label: "Impact & Analytics", href: "/donor/analytics", icon: BarChart3 },
    { label: "ESG Certificates", href: "/donor/certificates", icon: Award },
    { label: "Kitchen Settings", href: "/donor/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">FoodLoop</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                Donor
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Commercial Kitchen Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Donor Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/60 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
            GH
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Grand Heritage Banquets</p>
            <p className="text-[10px] text-emerald-400 truncate">FSSAI: 10018011003421</p>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </span>
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
        </Link>
      </div>
    </aside>
  );
}
