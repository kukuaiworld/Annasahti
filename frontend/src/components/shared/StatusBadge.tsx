import { CheckCircle2, Clock, AlertTriangle, Truck, Ban, ShieldCheck, HeartHandshake, Flame, RefreshCcw } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const norm = status.toLowerCase();

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  if (norm === "delivered" || norm === "verified" || norm === "fulfilled" || norm === "ready") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span className="capitalize">{status.replace(/_/g, " ")}</span>
      </span>
    );
  }

  if (norm === "in_transit" || norm === "en_route") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 ${sizeClasses}`}>
        <Truck className="w-3 h-3 text-blue-600 animate-pulse" />
        <span>In Transit</span>
      </span>
    );
  }

  if (norm === "matched" || norm === "assigned") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 ${sizeClasses}`}>
        <HeartHandshake className="w-3 h-3 text-purple-600" />
        <span className="capitalize">{status.replace(/_/g, " ")}</span>
      </span>
    );
  }

  if (norm === "inspected") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200 ${sizeClasses}`}>
        <ShieldCheck className="w-3 h-3 text-teal-600" />
        <span>Inspected (Safe)</span>
      </span>
    );
  }

  if (norm === "diverted" || norm === "tier3_animal_feed" || norm === "tier4_compost_biofuel") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 ${sizeClasses}`}>
        <RefreshCcw className="w-3 h-3 text-amber-700" />
        <span>Diverted ({status.includes("tier4") ? "Biogas" : "Animal Feed"})</span>
      </span>
    );
  }

  if (norm === "critical") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 border border-red-300 ${sizeClasses}`}>
        <Flame className="w-3 h-3 text-red-600 animate-bounce" />
        <span>Critical Priority</span>
      </span>
    );
  }

  if (norm === "high") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 ${sizeClasses}`}>
        <AlertTriangle className="w-3 h-3 text-orange-600" />
        <span>High Priority</span>
      </span>
    );
  }

  if (norm === "pending" || norm === "posted") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
        <Clock className="w-3 h-3 text-slate-500" />
        <span className="capitalize">{status.replace(/_/g, " ")}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses}`}>
      <span>{status}</span>
    </span>
  );
}
