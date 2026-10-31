"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Cpu,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Lock,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { UserAccount, Donation, RecipientRequest, AuditLog } from "@/types";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setUsers(storageService.getUsers());
    setDonations(storageService.getDonations());
    setRequests(storageService.getRequests());
    setLogs(storageService.getAuditLogs());
  }, []);

  const totalKg = donations.reduce((sum, d) => sum + d.totalKg, 0);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Central Directorate Command Center"
        subtitle="National Overview • FSSAI Food Recovery & Multi-Tier Routing Operations"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-7xl">
        <Breadcrumbs items={[{ label: "Admin Portal", href: "/admin/dashboard" }, { label: "Directorate Overview" }]} />

        {/* Top Directorate Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Verified Entities</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{users.length}</div>
              <span className="text-[10px] text-blue-600 font-semibold mt-1 block">Across 6 Ecosystem Roles</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">National Rescued Payload</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalKg} kg</div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">100% Landfill Diverted</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Open Recipient Demands</span>
              <div className="text-2xl font-black text-purple-700 mt-1">
                {requests.filter((r) => r.status === "pending").length}
              </div>
              <span className="text-[10px] text-purple-600 font-semibold mt-1 block">Awaiting Courier Match</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">FSSAI QA Compliance</span>
              <div className="text-2xl font-black text-teal-700 mt-1">100.0%</div>
              <span className="text-[10px] text-teal-600 font-semibold mt-1 block">Zero Contamination Incident</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Controls Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/verifications"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Review Entity Verifications</h4>
              <p className="text-xs text-slate-500 mt-0.5">Approve newly registered hotels, NGOs & gaushalas</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </Link>

          <Link
            href="/admin/inventory"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Consignment Inventory</h4>
              <p className="text-xs text-slate-500 mt-0.5">Track all food batches, verification tiers and holdings</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </Link>

          <Link
            href="/admin/logs"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-sm flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Security & Audit Logs</h4>
              <p className="text-xs text-slate-500 mt-0.5">Tamper-evident system activity and timestamps</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>

        {/* Recent System Audit Logs */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Real-Time Operational Audit Feed</h3>
              <p className="text-xs text-slate-500">Live tamper-evident stream of network events</p>
            </div>
            <Link
              href="/admin/logs"
              className="text-xs font-bold text-slate-800 hover:text-black flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">{log.actor} ({log.role})</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap">
                  {log.timestamp.slice(11, 19)} UTC
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
