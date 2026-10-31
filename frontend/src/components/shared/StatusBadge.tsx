import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  Ban,
  ShieldCheck,
  HeartHandshake,
  Flame,
  RefreshCcw,
} from "lucide-react";
import { FoodBatchStatus } from "@/types/batches";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const norm = (status || "").toLowerCase();
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  if (
    norm === FoodBatchStatus.APPROVED ||
    norm === "approved" ||
    norm === FoodBatchStatus.COMPLETED ||
    norm === "delivered" ||
    norm === "verified" ||
    norm === "fulfilled"
  ) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span className="capitalize">{norm.replace(/_/g, " ")}</span>
      </span>
    );
  }

  if (
    norm === FoodBatchStatus.PENDING_INSPECTION ||
    norm === "pending_inspection" ||
    norm === "pending" ||
    norm === "posted"
  ) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
        <Clock className="w-3 h-3 text-amber-600" />
        <span>Pending Inspection</span>
      </span>
    );
  }

  if (norm === FoodBatchStatus.HOLD || norm === "hold" || norm === "requires_review") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 ${sizeClasses}`}>
        <AlertTriangle className="w-3 h-3 text-orange-600" />
        <span>Food Safety Hold</span>
      </span>
    );
  }

  if (
    norm === FoodBatchStatus.ALLOCATED ||
    norm === FoodBatchStatus.PARTIALLY_ALLOCATED ||
    norm === "allocated" ||
    norm === "matched" ||
    norm === "assigned"
  ) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 ${sizeClasses}`}>
        <HeartHandshake className="w-3 h-3 text-purple-600" />
        <span className="capitalize">{norm.replace(/_/g, " ")}</span>
      </span>
    );
  }

  if (norm === FoodBatchStatus.IN_TRANSIT || norm === "in_transit" || norm === "en_route") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 ${sizeClasses}`}>
        <Truck className="w-3 h-3 text-blue-600 animate-pulse" />
        <span>In Transit</span>
      </span>
    );
  }

  if (norm === FoodBatchStatus.REJECTED || norm === "rejected" || norm === "cancelled") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 border border-red-200 ${sizeClasses}`}>
        <Ban className="w-3 h-3 text-red-600" />
        <span className="capitalize">{norm.replace(/_/g, " ")}</span>
      </span>
    );
  }

  if (norm === FoodBatchStatus.EXPIRED || norm === "expired") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
        <Clock className="w-3 h-3 text-slate-500" />
        <span>Expired</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses}`}>
      <span className="capitalize">{norm.replace(/_/g, " ")}</span>
    </span>
  );
}
