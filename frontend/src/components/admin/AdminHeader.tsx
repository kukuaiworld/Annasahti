"use client";

import Link from "next/link";
import { Package, ShieldCheck } from "lucide-react";

export default function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
      <div className="min-w-0 pr-4">
        <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight truncate">
          {title}
        </h1>
        {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/admin/inventory"
          className="btn-interactive btn-secondary px-3.5 py-2 text-xs font-bold gap-1.5"
        >
          <Package className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="hidden sm:inline">Consignment Inventory</span>
          <span className="sm:hidden">Inventory</span>
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden md:inline font-semibold text-slate-700">Directorate Mode</span>
        </div>
      </div>
    </header>
  );
}
