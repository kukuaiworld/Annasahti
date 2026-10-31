"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Navigation,
  MapPin,
  Trophy,
  Award,
  UserCheck,
  Truck,
  ExternalLink,
  LogOut,
  Zap,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";

export default function VolunteerSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const navItems = [
    { label: "Mission Dashboard", href: "/volunteer/dashboard", icon: LayoutDashboard },
    { label: "Active Rescue Tasks", href: "/volunteer/tasks", icon: Navigation },
    { label: "GPS Route Simulator", href: "/volunteer/routes", icon: MapPin },
    { label: "City Leaderboard", href: "/volunteer/leaderboard", icon: Trophy },
    { label: "Badges & Karma", href: "/volunteer/badges", icon: Award },
    { label: "Courier Profile", href: "/volunteer/profile", icon: UserCheck },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 min-h-screen">
      <div>
        {/* Header */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">FoodLoop</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                Courier
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Volunteer Mission Hub</p>
          </div>
        </div>

        {/* Links */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Dispatch Operations
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
                    ? "bg-blue-600 text-white shadow-sm"
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

      {/* Volunteer Profile Strip */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/60 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs uppercase">
            {profile?.fullName?.substring(0, 2) || "VO"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">
              {profile?.fullName || "Courier Volunteer"}
            </p>
            <p className="text-[10px] text-blue-400 truncate">
              Role: {profile?.role || "volunteer"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs px-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
