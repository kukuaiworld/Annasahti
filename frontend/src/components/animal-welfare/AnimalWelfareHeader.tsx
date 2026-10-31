"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function AnimalWelfareHeader({ title, subtitle }: { title: string; subtitle?: string }) {
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
          href="/animal-welfare/requests"
          className="btn-interactive px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm shadow-amber-600/25"
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Request Fodder/Feed</span>
        </Link>
      </div>
    </header>
  );
}
