"use client";

import { useState } from "react";
import { PlusCircle, PawPrint, CheckCircle2, ShieldCheck } from "lucide-react";
import AnimalWelfareHeader from "@/components/animal-welfare/AnimalWelfareHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function AnimalWelfareRequestsPage() {
  const [animalType, setAnimalType] = useState<"cattle" | "dogs_cats">("cattle");
  const [quantityKg, setQuantityKg] = useState(100);
  const [notes, setNotes] = useState("Require fresh vegetable peels, cauliflower leaves, or dry stale wheat rotis for 42 cows.");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AnimalWelfareHeader
        title="Sanctuary Fodder & Feed Requirements"
        subtitle="Request safe vegetable trimmings, grain mash or hotel broth from the Tier-3 pipeline"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-2xl">
        <Breadcrumbs items={[{ label: "Animal Welfare", href: "/animal-welfare/dashboard" }, { label: "Feed Requirements" }]} />

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center space-y-2 animate-fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base">Fodder Requirement Dispatched!</h4>
              <p className="text-xs text-emerald-700">
                Any upcoming hotel or market consignments flagged for Tier-3 diversion will route to your gaushala.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Animal Classification
                </label>
                <select
                  value={animalType}
                  onChange={(e) => setAnimalType(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="cattle">Cattle / Dairy Gaushala (Vegetable trimmings, hay, grain mash)</option>
                  <option value="dogs_cats">Rescued Dogs / Sanctuary (Unspiced boiled rice, chicken broth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Daily Volume Capacity (kg)
                </label>
                <input
                  type="number"
                  min="20"
                  max="1000"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shelter Dietary Screening Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  All Tier-3 diverted shipments undergo volunteer visual inspection for absence of packaging, plastic, or toxic seasonings.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Fodder Requirement</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
