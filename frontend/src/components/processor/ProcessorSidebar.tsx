"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Flame,
  ShieldAlert,
  BarChart2,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function ProcessorSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Plant Dashboard", href: "/processor/dashboard", icon: LayoutDashboard },
    { label: "Feedstock Batches", href: "/processor/batches", icon: Factory },
    { label: "Inbound QA & pH Check", href: "/processor/qa-inspection", icon: ShieldAlert },
    { label: "BioCNG & Compost Units", href: "/processor/compost-biofuel", icon: Flame },
    { label: "Circular Reports", href: "/processor/reports", icon: BarChart2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 min-h-screen">
      <div>
        {/* Header */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">AnnaSathi</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                Processor
              </span>
            </div>
            <p className="text-[10px] text-slate-400">BioCNG & Clean Energy</p>
          </div>
        </div>

        {/* Links */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Plant Processing
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
                    ? "bg-teal-600 text-white shadow-sm"
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

      {/* Profile */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800/60 p-3 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
            DU
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Delhi Urja BioCNG Plant</p>
            <p className="text-[10px] text-teal-400 truncate">Anaerobic Digester #3</p>
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
