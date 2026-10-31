"use client";

import { useState } from "react";
import { User, Phone, MapPin, Truck, ShieldCheck, CheckCircle2, Save } from "lucide-react";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function VolunteerProfilePage() {
  const [name, setName] = useState("Aarav Sharma");
  const [phone, setPhone] = useState("+91 98711 22334");
  const [city, setCity] = useState("Delhi NCR (North Sector)");
  const [vehicle, setVehicle] = useState("e-rickshaw");
  const [regNo, setRegNo] = useState("DL-04-EV-9821");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <VolunteerHeader
        title="Volunteer Courier Profile"
        subtitle="Manage fleet vehicle details, thermal bag certification and dispatch preferences"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-3xl">
        <Breadcrumbs items={[{ label: "Volunteer Hub", href: "/volunteer/dashboard" }, { label: "Courier Profile" }]} />

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {saved && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Courier credentials updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (SMS Dispatch)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational City & Zone</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Classification</label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="e-rickshaw">Electric Cargo Rickshaw (Large Feasts)</option>
                  <option value="bike_insulated_bag">Motorcycle / E-Bike with Thermal Box</option>
                  <option value="van">Covered Commercial Delivery Van</option>
                  <option value="mini_truck">Mini Truck (Payload &gt; 500kg)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Registration / License Plate
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Good Samaritan Field Pass Verified</span>
              </div>
              <p className="text-[11px] text-blue-800">
                You carry official authorization to transport surplus food between registered donors and non-profit shelters.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Courier Details</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
