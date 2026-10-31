"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Cpu, AlertTriangle } from "lucide-react";

export default function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/matching"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Cpu className="w-3.5 h-3.5 text-red-400" />
          <span>Matching Engine</span>
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="hidden sm:inline font-semibold text-slate-700">Directorate Mode</span>
        </div>
      </div>
    </header>
  );
}
