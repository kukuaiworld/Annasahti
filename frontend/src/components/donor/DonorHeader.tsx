"use client";

import Link from "next/link";
import { Bell, PlusCircle, Search, ShieldCheck } from "lucide-react";

export default function DonorHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/donor/new-donation"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Post Surplus</span>
        </Link>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline font-medium">Pickup Network Live</span>
        </div>
      </div>
    </header>
  );
}
