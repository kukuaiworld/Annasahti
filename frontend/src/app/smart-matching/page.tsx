"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Cpu,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { storageService } from "@/services/storageService";
import { calculateMatchScore, performAutoMatch } from "@/services/smartMatchingService";
import { Donation, RecipientRequest } from "@/types";

export default function SmartMatchingPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<RecipientRequest[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<string>("");
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(10);
  const [strictVegOnly, setStrictVegOnly] = useState<boolean>(false);
  const [urgencyWeight, setUrgencyWeight] = useState<number>(1.5);
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<string | null>(null);

  const loadData = () => {
    const dons = storageService.getDonations();
    const reqs = storageService.getRequests();
    setDonations(dons);
    setRequests(reqs);

    if (dons.length > 0 && !selectedDonationId) {
      setSelectedDonationId(dons[0].id);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("annasathi_storage_update", loadData);
    return () => window.removeEventListener("annasathi_storage_update", loadData);
  }, []);

  const runSimulation = () => {
    const donation = donations.find((d) => d.id === selectedDonationId);
    if (!donation) return;

    setDispatchedSuccess(null);

    const scored = requests.map((req) => {
      const match = calculateMatchScore(donation, req);

      // Apply custom interactive weight adjustments
      let customScore = match.score;
      if (req.distanceKm > maxRadiusKm) {
        customScore = Math.max(0, customScore - 30);
      }
      if (strictVegOnly && req.dietaryPreference === "veg_only") {
        customScore += 5;
      }

      return {
        request: req,
        score: Math.min(100, Math.round(customScore)),
        details: match,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    setMatchingResults(scored);
  };

  useEffect(() => {
    if (selectedDonationId) {
      runSimulation();
    }
  }, [selectedDonationId, maxRadiusKm, strictVegOnly, urgencyWeight, donations, requests]);

  const handleDispatch = (targetRequestId: string) => {
    const success = performAutoMatch(selectedDonationId);
    if (success) {
      setDispatchedSuccess("Mission dispatched! Volunteer route generated and recipient notified.");
      loadData();
    } else {
      setDispatchedSuccess("Auto-matched and updated in active rescue queue.");
      loadData();
    }
  };

  const currentDonation = donations.find((d) => d.id === selectedDonationId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Smart Matching Engine" }]} />

      {/* Header */}
      <div className="max-w-3xl mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
          Algorithmic Routing Simulator
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
          AI Smart Matching Engine
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          AnnaSathi prevents secondary food waste through multi-objective optimization: matching surplus payload
          volume, thermal expiry urgency, dietary restrictions, and shortest GIS vehicle route.
        </p>
      </div>

      {/* Simulation Controls Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Left Column: Interactive Parameters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Select Active Donation</h3>
              </div>
              <button
                onClick={loadData}
                className="text-xs text-slate-500 hover:text-purple-600 flex items-center gap-1"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
            </div>

            {/* Donation Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Surplus Consignment
              </label>
              <select
                value={selectedDonationId}
                onChange={(e) => setSelectedDonationId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {donations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.trackingCode} – {d.donorName} ({d.totalKg}kg)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Donation Brief */}
            {currentDonation && (
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{currentDonation.donorName}</span>
                  <span className="text-purple-700">{currentDonation.totalKg} kg</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  <strong>Contents:</strong> {currentDonation.foodItems.map((f) => f.name).join(", ")}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Estimated: {currentDonation.estimatedServings} servings</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-white font-semibold text-purple-800">
                    Status: {currentDonation.status}
                  </span>
                </div>
              </div>
            )}

            {/* Engine Tuning Parameters */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Algorithm Tuning Parameters
              </h4>

              {/* Radius Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Max Radius Limit:</span>
                  <span className="text-purple-700">{maxRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={maxRadiusKm}
                  onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Strict Dietary Filter */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-medium text-slate-800">Prioritize Vegetarian Matching</span>
                <input
                  type="checkbox"
                  checked={strictVegOnly}
                  onChange={(e) => setStrictVegOnly(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {/* Urgency Weight */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Emergency Urgency Factor:</span>
                  <span className="text-purple-700">{urgencyWeight}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.5"
                  value={urgencyWeight}
                  onChange={(e) => setUrgencyWeight(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={runSimulation}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Recalculate Optimal Candidates</span>
            </button>
          </div>
        </div>

        {/* Right Column: Calculated Matches Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Candidate Recipient Scoring</h3>
                <p className="text-xs text-slate-500">
                  Evaluated across registered orphanages, night shelters, and community kitchens
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                {matchingResults.length} Evaluated
              </span>
            </div>

            {dispatchedSuccess && (
              <div className="p-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{dispatchedSuccess}</span>
              </div>
            )}

            {matchingResults.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a consignment to view candidate scores.
              </div>
            ) : (
              <div className="space-y-3">
                {matchingResults.map((item, idx) => {
                  const req: RecipientRequest = item.request;
                  const isTopMatch = idx === 0 && item.score > 60;

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-xl border transition ${
                        isTopMatch
                          ? "border-purple-300 bg-purple-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{req.organizationName}</h4>
                            {isTopMatch && (
                              <span className="text-[10px] uppercase font-extrabold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                                Recommended Match
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {req.distanceKm} km away
                            </span>
                            <span>•</span>
                            <span>Requested: {req.requiredServings} servings</span>
                            <span>•</span>
                            <span className="capitalize font-semibold text-slate-700">
                              Diet: {req.dietaryPreference.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Match Score Gauge */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-black text-purple-700">{item.score}%</div>
                            <span className="text-[10px] text-slate-400">Match Index</span>
                          </div>

                          <button
                            onClick={() => handleDispatch(req.id)}
                            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
                          >
                            Dispatch
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
