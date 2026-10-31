"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  UtensilsCrossed,
  CheckCircle2,
  ShieldAlert,
  Clock,
  AlertCircle,
  Building,
  Loader2,
} from "lucide-react";
import DonorHeader from "@/components/donor/DonorHeader";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { batchesApi } from "@/services/api/batches";
import { useAuth } from "@/providers/auth-provider";
import { CreateFoodBatchDto, FoodBatchRecord, QuantityUnit } from "@/types/batches";

export default function NewDonationPage() {
  const router = useRouter();
  const { user, profile, organisation } = useAuth();

  const [foodName, setFoodName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(25);
  const [quantityUnit, setQuantityUnit] = useState<string>(QuantityUnit.KG);
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<number>(25);
  const [preparedAt, setPreparedAt] = useState<string>("");
  const [bestBeforeAt, setBestBeforeAt] = useState<string>("");
  const [pickupDeadline, setPickupDeadline] = useState<string>("");
  const [storageInstructions, setStorageInstructions] = useState(
    "Store in clean insulated thermal containers. Loading dock #2."
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBatch, setCreatedBatch] = useState<FoodBatchRecord | null>(null);

  // Determine active donor organisation ID
  const activeOrgId = organisation?.id || profile?.organisationId || "";
  const activeOrgName = organisation?.name || "Your Organisation";

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeOrgId) {
      setErrorMessage(
        "Missing organisation context: Your profile must belong to a verified donor organisation before food batches can be created."
      );
      return;
    }

    if (!foodName.trim()) {
      setErrorMessage("Food name is required.");
      return;
    }

    if (quantity <= 0) {
      setErrorMessage("Quantity must be greater than zero.");
      return;
    }

    // Date validations
    if (preparedAt && bestBeforeAt && new Date(bestBeforeAt) < new Date(preparedAt)) {
      setErrorMessage("Best before date/time cannot be earlier than preparation date/time.");
      return;
    }

    if (pickupDeadline && bestBeforeAt && new Date(pickupDeadline) > new Date(bestBeforeAt)) {
      setErrorMessage("Pickup deadline cannot be after best before date/time.");
      return;
    }

    setLoading(true);

    const payload: CreateFoodBatchDto = {
      donorOrganisationId: activeOrgId,
      foodName: foodName.trim(),
      description: description.trim() || undefined,
      quantity: Number(quantity),
      quantityUnit,
      estimatedWeightKg: estimatedWeightKg ? Number(estimatedWeightKg) : undefined,
      preparedAt: preparedAt ? new Date(preparedAt).toISOString() : undefined,
      bestBeforeAt: bestBeforeAt ? new Date(bestBeforeAt).toISOString() : undefined,
      pickupDeadline: pickupDeadline ? new Date(pickupDeadline).toISOString() : undefined,
      storageInstructions: storageInstructions.trim() || undefined,
    };

    try {
      // Direct call to backend NestJS POST /api/v1/batches
      // Notice: No auto-match or client heuristics are triggered.
      const batch = await batchesApi.createBatch(payload);
      setCreatedBatch(batch);
      setLoading(false);

      setTimeout(() => {
        router.push("/donor/donations");
      }, 3000);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "Failed to create food batch on the server.");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DonorHeader
        title="Post Commercial Surplus Food Batch"
        subtitle="Register surplus consignments for verified inspection and redistribution"
      />

      <div className="p-6 sm:p-8 space-y-6 flex-1 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: "Donor Portal", href: "/donor/dashboard" },
            { label: "Post Surplus Food" },
          ]}
        />

        {createdBatch ? (
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-emerald-300 shadow-sm text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Batch Registered on FoodLoop!</h2>
            <div className="text-xl font-mono font-bold text-brand-700 bg-brand-50 inline-block px-4 py-2 rounded-xl border border-brand-200">
              {createdBatch.batch_code}
            </div>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Consignment ID: <strong>{createdBatch.id}</strong>. Initial Status:{" "}
              <span className="font-bold text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded">
                {createdBatch.status.replace("_", " ")}
              </span>
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 max-w-lg mx-auto text-left flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Food Safety Hold Enforced:</span>
                <span>
                  Per FoodLoop food safety rules, all newly created batches remain in PENDING INSPECTION until an authorized human inspector verifies temperature and quality. Courier dispatch will occur following approved inspection.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            {/* Organisation Context Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-brand-600" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Donor Organisation
                  </span>
                  <span className="font-bold text-slate-800">
                    {activeOrgName} {activeOrgId ? `(${activeOrgId.slice(0, 8)}...)` : "(Unassigned)"}
                  </span>
                </div>
              </div>

              {!activeOrgId && (
                <span className="text-red-600 font-semibold text-[11px] bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                  Profile must be linked to an organisation
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  1. Consignment Details
                </h3>

                <div>
                  <label htmlFor="foodName" className="block text-xs font-semibold text-slate-700 mb-1">
                    Food Name / Dish Description *
                  </label>
                  <input
                    id="foodName"
                    type="text"
                    required
                    maxLength={200}
                    placeholder="e.g. Fresh Steamed Rice & Dal Makhani"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Item Details (Allergens, Ingredients)
                  </label>
                  <textarea
                    id="description"
                    rows={2}
                    maxLength={1000}
                    placeholder="e.g. Vegetarian, contains dairy. Cooked under commercial banquet conditions."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-xs font-semibold text-slate-700 mb-1">
                      Batch Quantity *
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                    />
                  </div>

                  <div>
                    <label htmlFor="quantityUnit" className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity Unit *
                    </label>
                    <select
                      id="quantityUnit"
                      value={quantityUnit}
                      onChange={(e) => setQuantityUnit(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value={QuantityUnit.KG}>Kilograms (kg)</option>
                      <option value={QuantityUnit.PORTIONS}>Individual Portions</option>
                      <option value={QuantityUnit.BOXES}>Sealed Boxes</option>
                      <option value={QuantityUnit.CRATES}>Crates</option>
                      <option value={QuantityUnit.LITRES}>Litres</option>
                      <option value={QuantityUnit.TRAYS}>Steam Trays</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="estimatedWeightKg" className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimated Weight (kg)
                    </label>
                    <input
                      id="estimatedWeightKg"
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="Optional total kg"
                      value={estimatedWeightKg}
                      onChange={(e) => setEstimatedWeightKg(Number(e.target.value))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  2. Handling & Time Constraints
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="preparedAt" className="block text-xs font-semibold text-slate-700 mb-1">
                      Preparation Time
                    </label>
                    <input
                      id="preparedAt"
                      type="datetime-local"
                      value={preparedAt}
                      onChange={(e) => setPreparedAt(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="bestBeforeAt" className="block text-xs font-semibold text-slate-700 mb-1">
                      Best Before Time
                    </label>
                    <input
                      id="bestBeforeAt"
                      type="datetime-local"
                      value={bestBeforeAt}
                      onChange={(e) => setBestBeforeAt(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="pickupDeadline" className="block text-xs font-semibold text-slate-700 mb-1">
                      Pickup Deadline
                    </label>
                    <input
                      id="pickupDeadline"
                      type="datetime-local"
                      value={pickupDeadline}
                      onChange={(e) => setPickupDeadline(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="storageInstructions" className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage & Dock Instructions
                  </label>
                  <input
                    id="storageInstructions"
                    type="text"
                    maxLength={500}
                    value={storageInstructions}
                    onChange={(e) => setStorageInstructions(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading ? "true" : undefined}
                  className="btn-interactive btn-primary w-full py-3.5 text-xs font-bold gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Submitting Consignment to AnnaSathi API...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 shrink-0" />
                      <span>Post Consignment to AnnaSathi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
