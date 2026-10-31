"use client";

import Link from "next/link";
import { PawPrint, PlusCircle, Leaf } from "lucide-react";

export default function AnimalWelfareHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/animal-welfare/requests"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Request Fodder/Feed</span>
        </Link>
      </div>
    </header>
  );
}
