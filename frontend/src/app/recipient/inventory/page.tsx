"use client";

import { PackageCheck, CheckCircle2, ShieldCheck, Clock, Calendar } from "lucide-react";
import RecipientHeader from "@/components/recipient/RecipientHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function RecipientInventoryPage() {
  const pantryItems = [
    {
      name: "Multigrain Bakery Loaves & Buns",
      received: "Today, 04:30 AM",
      expiry: "Nov 01, 2026 (48 hrs)",
      qty: "28 kg (~85 buns)",
      source: "Artisan Oven Bakery & Patisserie",
      storage: "Dry Pantry Shelf A",
      status: "Safe for consumption",
    },
    {
      name: "Fresh Seasonal Apples & Bananas",
      received: "Yesterday, 05:00 PM",
      expiry: "Nov 03, 2026",
      qty: "40 kg",
      source: "FreshBasket APMC Wholesale",
      storage: "Cold Room 2 (12°C)",
      status: "Safe for consumption",
    },
    {
      name: "Sealed Basmati Rice Bags",
      received: "Oct 28, 2026",
      expiry: "Dec 30, 2026",
      qty: "150 kg",
      source: "Corporate CSR Donation",
      storage: "Dry Granary",
      status: "Long shelf life",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <RecipientHeader
        title="Shelter Food Pantry Stock & Cold Storage"
        subtitle="Current inventory, expiration dates and food storage safety records"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-5xl">
        <Breadcrumbs items={[{ label: "Recipient Portal", href: "/recipient/dashboard" }, { label: "Pantry & Stock" }]} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Active Pantry Volume</span>
            <div className="text-2xl font-black text-slate-900 mt-1">218 kg</div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Sufficient for 3 days</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Cold Storage Temp</span>
            <div className="text-2xl font-black text-blue-600 mt-1">4.2°C</div>
            <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">Within FSSAI specs</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Zero Spoilage Metric</span>
            <div className="text-2xl font-black text-purple-700 mt-1">99.8%</div>
            <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">Minimal kitchen waste</span>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Active Stock Manifest</h3>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Donor Source</th>
                <th className="py-3 px-4">Storage Bin</th>
                <th className="py-3 px-4">Expiry Window</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {pantryItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-purple-700">{item.qty}</td>
                  <td className="py-3.5 px-4 text-slate-600">{item.source}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.storage}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.expiry}</td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 font-bold">
                    {item.status}
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
