"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Lock,
} from "lucide-react";
import { batchesApi } from "@/services/api/batches";
import { SafeChainEvent } from "@/types/batches";

interface SafeChainTimelineProps {
  batchId: string;
}

export default function SafeChainTimeline({ batchId }: SafeChainTimelineProps) {
  const [events, setEvents] = useState<SafeChainEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await batchesApi.getBatchHistory(batchId);
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load SafeChain audit trail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [batchId]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-600" />
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            SafeChain Operational Traceability Ledger
          </h3>
        </div>
        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="text-slate-400 hover:text-slate-600 transition"
          title="Refresh Ledger"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : events.length === 0 ? (
        <p className="text-slate-400 italic text-center py-4">
          No SafeChain ledger events recorded yet for this consignment.
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((evt, idx) => (
            <div
              key={evt.id || idx}
              className="flex items-start gap-3 p-3 bg-slate-50/70 border border-slate-100 rounded-xl"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-teal-900 text-[11px] uppercase">
                    {evt.eventType.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(evt.timestamp).toLocaleString()}</span>
                  </span>
                </div>
                {evt.payload?.description && (
                  <p className="text-slate-700 text-xs">{evt.payload.description}</p>
                )}
                {evt.eventHash && (
                  <p className="font-mono text-[9px] text-slate-400 truncate">
                    Hash: {evt.eventHash}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
