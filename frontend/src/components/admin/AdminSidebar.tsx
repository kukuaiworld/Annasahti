"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Cpu,
  Package,
  BarChart3,
  FileText,
  Settings,
  Lock,
  LogOut,
  ExternalLink,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Admin Directorate", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Stakeholder Directory", href: "/admin/users", icon: Users },
    { label: "FSSAI & NGO Verification", href: "/admin/verifications", icon: ShieldCheck },
    { label: "Consignment Inventory", href: "/admin/inventory", icon: Package },
    { label: "National Impact Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "System Audit Logs", href: "/admin/logs", icon: FileText },
    { label: "Engine Configuration", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 min-h-screen">
      <div>
        {/* Header */}
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800 bg-slate-900/50">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">AnnaSathi</span>
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-semibold uppercase">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Central Directorate Portal</p>
          </div>
        </div>

        {/* Links */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Directorate Oversight
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
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/30">
        <div className="bg-slate-900 p-3 rounded-xl flex items-center gap-3 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs border border-slate-700">
            SN
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Siddharth Nambiar</p>
            <p className="text-[10px] text-slate-400 truncate">Central Director General</p>
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
