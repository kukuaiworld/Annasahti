"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  UtensilsCrossed,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { storageService } from "@/services/storageService";
import { performAutoMatch } from "@/services/smartMatchingService";
import { FoodItem, FoodType, Donation } from "@/types";

export default function NewDonationPage() {
  const router = useRouter();

  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState<FoodType>("cooked_meals");
  const [quantityKg, setQuantityKg] = useState<number>(30);
  const [servings, setServings] = useState<number>(80);
  const [dietaryType, setDietaryType] = useState<"veg" | "non-veg" | "vegan" | "egg">("veg");

  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    {
      id: "fi-init",
      name: "Dal Makhani & Steamed Basmati Rice",
      category: "cooked_meals",
      quantityKg: 35,
      servings: 95,
      expiryTime: new Date(Date.now() + 6 * 3600000).toISOString(),
      dietaryType: "veg",
      allergens: ["dairy"],
      temperatureType: "hot",
    },
  ]);

  const [pickupStart, setPickupStart] = useState("06:00 AM");
  const [pickupEnd, setPickupEnd] = useState("08:30 AM");
  const [instructions, setInstructions] = useState("Loading dock #2. Insulated containers provided.");
  const [submitted, setSubmitted] = useState(false);
  const [createdCode, setCreatedCode] = useState("");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    const newItem: FoodItem = {
      id: "fi-" + Date.now(),
      name: dishName,
      category,
      quantityKg: Number(quantityKg),
      servings: Number(servings),
      expiryTime: new Date(Date.now() + 6 * 3600000).toISOString(),
      dietaryType,
      allergens: [],
      temperatureType: "hot",
    };

    setFoodItems([...foodItems, newItem]);
    setDishName("");
  };

  const handleRemoveItem = (id: string) => {
    setFoodItems(foodItems.filter((item) => item.id !== id));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (foodItems.length === 0) return;

    const totalKg = foodItems.reduce((acc, curr) => acc + curr.quantityKg, 0);
    const totalServings = foodItems.reduce((acc, curr) => acc + curr.servings, 0);
    const trackingCode = "AS-2026-" + Math.floor(1000 + Math.random() * 9000);

    const newDonation: Donation = {
      id: "don-" + Date.now(),
      trackingCode,
      donorId: "usr-donor-1",
      donorName: "Grand Heritage Banquet & Caterers",
      donorType: "wedding_caterer",
      location: "Civil Lines, Sector 4, North Delhi",
      pincode: "110054",
      contactPhone: "+91 98112 34567",
      foodItems,
      totalKg,
      estimatedServings: totalServings,
      pickupWindow: {
        start: pickupStart,
        end: pickupEnd,
      },
      specialInstructions: instructions,
      status: "posted",
      createdAt: new Date().toISOString(),
      co2SavedKg: Math.round(totalKg * 2.4),
      waterSavedLitres: Math.round(totalKg * 60),
    };

    storageService.addDonation(newDonation);
    performAutoMatch(newDonation.id);

    setCreatedCode(trackingCode);
    setSubmitted(true);

    setTimeout(() => {
      router.push("/donor/donations");
    }, 2500);
  };

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Post Commercial Surplus Food"
        subtitle="List extra cooked meals or fresh produce for rapid local courier dispatch"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-4xl">
        <Breadcrumbs items={[{ label: "Donor Portal", href: "/donor/dashboard" }, { label: "Post Surplus Food" }]} />

        {submitted ? (
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-emerald-300 shadow-sm text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Consignment Registered!</h2>
            <div className="text-xl font-mono font-bold text-brand-700 bg-brand-50 inline-block px-4 py-2 rounded-xl border border-brand-200">
              {createdCode}
            </div>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              AnnaSathi&apos;s smart matching engine has been notified. An electric courier is being routed to your loading dock.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            {/* Step 1: Add Dishes */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">
                1. Add Food Dishes & Quantities
              </h3>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dish Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Paneer Pulao, Chapati, Dal Makhani"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Food Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as FoodType)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="cooked_meals">Cooked Feast / Banquet Meals</option>
                      <option value="raw_produce">Fresh Raw Fruits & Vegetables</option>
                      <option value="bakery_dairy">Fresh Bakery & Dairy Goods</option>
                      <option value="packaged_goods">Sealed Packaged Food</option>
                      <option value="perishable_mix">Vegetable Trimmings / Peels</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      min="1"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Servings</label>
                    <input
                      type="number"
                      min="1"
                      value={servings}
                      onChange={(e) => setServings(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Flag</label>
                    <select
                      value={dietaryType}
                      onChange={(e) => setDietaryType(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="veg">Strict Vegetarian</option>
                      <option value="vegan">Pure Vegan</option>
                      <option value="non-veg">Non-Vegetarian</option>
                      <option value="egg">Contains Egg</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Dish to Consignment</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700">Consignment Manifest:</span>
                {foodItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-slate-500 ml-2">
                        ({item.quantityKg} kg • ~{item.servings} servings • {item.dietaryType})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Logistics & Windows */}
            <form onSubmit={handleFinalSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                2. Pickup Timing & Special Dock Instructions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Window Start</label>
                  <input
                    type="text"
                    value={pickupStart}
                    onChange={(e) => setPickupStart(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Window End (Cutoff)</label>
                  <input
                    type="text"
                    value={pickupEnd}
                    onChange={(e) => setPickupEnd(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dock Instructions & Packaging Type
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                <span>
                  Protected under the Good Samaritan Legal Framework. Your kitchen is immune from liability for bona fide surplus food donations.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Broadcast Surplus Consignment to Matching Engine</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
