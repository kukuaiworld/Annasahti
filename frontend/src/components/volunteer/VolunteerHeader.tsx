"use client";

import Link from "next/link";
import { Zap, Navigation, Award, CheckCircle2 } from "lucide-react";

export default function VolunteerHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/volunteer/tasks"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Active Tasks</span>
        </Link>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs font-bold">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>4,850 pts</span>
        </div>
      </div>
    </header>
  );
}
