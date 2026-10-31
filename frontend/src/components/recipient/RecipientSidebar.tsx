"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  PackageCheck,
  MessageSquareHeart,
  HeartHandshake,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function RecipientSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Shelter Dashboard", href: "/recipient/dashboard", icon: LayoutDashboard },
    { label: "Incoming Allocations", href: "/recipient/allocations", icon: HeartHandshake },
    { label: "Meal Demands", href: "/recipient/requests", icon: ClipboardList },
    { label: "Request Food Help", href: "/recipient/new-request", icon: PlusCircle },
    { label: "Pantry & Stock", href: "/recipient/inventory", icon: PackageCheck },
    { label: "Quality Feedback", href: "/recipient/feedback", icon: MessageSquareHeart },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 min-h-screen">
      <div>
        {/* Header */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">FoodLoop</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                Shelter
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Recipient NGO Portal</p>
          </div>
        </div>

        {/* Links */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Shelter Care
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
                    ? "bg-purple-600 text-white shadow-sm"
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

      {/* Recipient Profile Strip */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/60 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
            AK
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Asha Kiran Orphanage</p>
            <p className="text-[10px] text-purple-400 truncate">120 Children • Veg Only</p>
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
