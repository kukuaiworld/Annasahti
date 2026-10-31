"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileText } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StatusBadge from "@/components/shared/StatusBadge";
import { storageService } from "@/services/storageService";
import { UserAccount } from "@/types";

export default function AdminVerificationsPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = () => {
    setUsers(storageService.getUsers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("annasathi_storage_update", loadData);
    return () => window.removeEventListener("annasathi_storage_update", loadData);
  }, []);

  const handleAction = (userId: string, newStatus: "verified" | "rejected", name: string) => {
    storageService.updateUserVerification(userId, newStatus);
    storageService.addAuditLog({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "Central Directorate Staff",
      role: "admin",
      action: newStatus === "verified" ? "KYC_VERIFICATION_APPROVED" : "KYC_VERIFICATION_REJECTED",
      details: `Verification status for ${name} set to ${newStatus.toUpperCase()}`,
      ipAddress: "127.0.0.1 (admin)",
    });

    setNotice(`Updated verification for ${name} to ${newStatus.toUpperCase()}`);
    setTimeout(() => setNotice(null), 3000);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="FSSAI & Non-Profit Credential Verification"
        subtitle="Review commercial food safety permits and NGO Darpan registration documents"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-6xl">
        <Breadcrumbs items={[{ label: "Admin Portal", href: "/admin/dashboard" }, { label: "Verifications" }]} />

        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Registered Stakeholder Applications</h3>
            <span className="text-xs font-bold text-slate-500">{users.length} Total Entities</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Entity Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">License / Registration</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Directorate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{user.organization || user.name}</p>
                    <p className="text-[11px] text-slate-500">Contact: {user.name} ({user.phone})</p>
                  </td>
                  <td className="py-3.5 px-4 capitalize font-semibold">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px]">
                      {user.role.replace("-", " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                    {user.fssaiNumber || "Under Review"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{user.joinedAt}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={user.verificationStatus} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.verificationStatus !== "verified" ? (
                        <button
                          onClick={() => handleAction(user.id, "verified", user.name)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-sm"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, "rejected", user.name)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg font-semibold text-[11px] transition border border-slate-200"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
