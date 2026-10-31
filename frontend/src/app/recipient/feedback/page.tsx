"use client";

import { useState } from "react";
import { MessageSquareHeart, Star, CheckCircle2, ShieldCheck, Heart } from "lucide-react";
import RecipientHeader from "@/components/recipient/RecipientHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export default function RecipientFeedbackPage() {
  const [rating, setRating] = useState(5);
  const [temperatureRating, setTemperatureRating] = useState("Steaming Hot (>60°C)");
  const [donorName, setDonorName] = useState("Grand Heritage Banquet & Caterers");
  const [comments, setComments] = useState("The children enjoyed the Paneer Butter Masala immensely! Packaging was perfectly sealed.");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <RecipientHeader
        title="Delivery Quality & Food Hygiene Feedback"
        subtitle="Review meals, confirm arrival hygiene, and rate donors and courier teams"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-2xl">
        <Breadcrumbs items={[{ label: "Recipient Portal", href: "/recipient/dashboard" }, { label: "Quality Feedback" }]} />

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-center space-y-2 animate-fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base">Feedback Transmitted!</h4>
              <p className="text-xs text-emerald-700">
                Your rating and temperature verification have been credited to the donor and courier karma ledger.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Recent Consignment</label>
                <select
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option>AS-2026-8941 – Grand Heritage Banquets (80kg Paneer Rice)</option>
                  <option>AS-2026-8946 – Artisan Oven Bakery (28kg Loaves)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Meal Quality</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`text-2xl transition ${rating >= s ? "text-amber-400" : "text-slate-300"}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Food Temperature Condition on Arrival
                </label>
                <select
                  value={temperatureRating}
                  onChange={(e) => setTemperatureRating(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option>Steaming Hot (&gt;60°C) – Thermal containers intact</option>
                  <option>Chilled / Cold (&lt;5°C) – Proper refrigeration maintained</option>
                  <option>Ambient Room Temperature (Fresh baked/produce)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes & Thank You Message to Donor Kitchen
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                <span>Submit Quality Audit & Thank Donor</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
