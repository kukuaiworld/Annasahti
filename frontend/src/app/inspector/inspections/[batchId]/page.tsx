"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Scale,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  History,
  CheckCircle2,
  Ban,
  Thermometer,
  Package,
  Eye,
  Wind,
  Plus,
  Trash2,
  ExternalLink,
  Info,
} from "lucide-react";
import { inspectionsApi } from "@/services/api/inspections";
import {
  BatchInspectionDetailResponse,
  CreateInspectionDto,
  InspectionDecision,
  InspectionRecord,
} from "@/types/inspections";
import { AnimalSpecies } from "@/types/batches";
import StatusBadge from "@/components/shared/StatusBadge";
import { ApiError } from "@/services/api/api-errors";

const ANIMAL_SPECIES_OPTIONS: { label: string; value: AnimalSpecies }[] = [
  { label: "Canine (Dogs)", value: AnimalSpecies.CANINE },
  { label: "Feline (Cats)", value: AnimalSpecies.FELINE },
  { label: "Bovine (Cattle)", value: AnimalSpecies.BOVINE },
  { label: "Porcine (Pigs)", value: AnimalSpecies.PORCINE },
  { label: "Poultry (Chickens/Birds)", value: AnimalSpecies.POULTRY },
  { label: "Equine (Horses)", value: AnimalSpecies.EQUINE },
  { label: "Other Species", value: AnimalSpecies.OTHER },
];

export default function BatchInspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  const [data, setData] = useState<BatchInspectionDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [decision, setDecision] = useState<InspectionDecision>(InspectionDecision.APPROVED_HUMAN);
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies[]>([]);
  const [temperatureC, setTemperatureC] = useState<string>("");
  const [packagingCondition, setPackagingCondition] = useState<string>("");
  const [appearanceCondition, setAppearanceCondition] = useState<string>("");
  const [odourCondition, setOdourCondition] = useState<string>("");
  const [handlingNotes, setHandlingNotes] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState<string>("");
  const [inspectionNotes, setInspectionNotes] = useState<string>("");

  // Safety checklist states
  const [checklist, setChecklist] = useState({
    visualContaminationClear: false,
    temperatureCompliant: false,
    packagingIntact: false,
    odourCharacteristic: false,
  });

  const [humanCertified, setHumanCertified] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchBatchDetail = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await inspectionsApi.getBatchInspectionDetail(batchId);
      setData(response);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isNotFound()) {
          setError("Food batch not found or you do not have permission to view this consignment.");
        } else {
          setError(`Backend Error (${err.statusCode}): ${err.message}`);
        }
      } else {
        setError(err.message || "Failed to load batch inspection details");
      }
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatchDetail();
  }, [fetchBatchDetail]);

  const handleSpeciesToggle = (species: AnimalSpecies) => {
    setSelectedSpecies((prev) =>
      prev.includes(species) ? prev.filter((s) => s !== species) : [...prev, species]
    );
  };

  const handleAddEvidence = () => {
    if (!newEvidenceUrl.trim()) return;
    try {
      new URL(newEvidenceUrl); // simple validation
      setEvidenceUrls((prev) => [...prev, newEvidenceUrl.trim()]);
      setNewEvidenceUrl("");
    } catch {
      alert("Please enter a valid URL (e.g., https://storage.foodloop.org/audit.jpg)");
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // 1. Mandatory Human Certification Guard
    if (!humanCertified) {
      setSubmitError(
        "You must explicitly certify that you have conducted human sensory/physical verification. AI models are strictly prohibited from approving food."
      );
      return;
    }

    // 2. Animal suitability requires target species
    if (decision === InspectionDecision.APPROVED_ANIMAL && selectedSpecies.length === 0) {
      setSubmitError(
        "FOOD SAFETY REQUIREMENT: You must select at least one explicit target species for animal consumption."
      );
      return;
    }

    // 3. Rejection requires reason
    if (decision === InspectionDecision.REJECTED && !rejectionReason.trim()) {
      setSubmitError("Please provide an explicit rejection reason for the audit trail.");
      return;
    }

    const payload: CreateInspectionDto = {
      batchId,
      decision,
      isAiAssessed: false,
      humanVerified: true,
      targetSpecies: decision === InspectionDecision.APPROVED_ANIMAL ? selectedSpecies : undefined,
      temperatureC: temperatureC !== "" ? parseFloat(temperatureC) : undefined,
      packagingCondition: packagingCondition.trim() || undefined,
      appearanceCondition: appearanceCondition.trim() || undefined,
      odourCondition: odourCondition.trim() || undefined,
      handlingNotes: handlingNotes.trim() || undefined,
      rejectionReason: decision === InspectionDecision.REJECTED ? rejectionReason.trim() : undefined,
      evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      safetyChecklist: {
        visual_contamination_clear: checklist.visualContaminationClear,
        temperature_compliant: checklist.temperatureCompliant,
        packaging_intact: checklist.packagingIntact,
        odour_characteristic: checklist.odourCharacteristic,
      },
      inspectionNotes: inspectionNotes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const record = await inspectionsApi.recordInspection(payload);
      setSubmitSuccess(
        `Inspection decision "${record.decision}" successfully committed to SafeChain ledger.`
      );
      // Reset form controls
      setHandlingNotes("");
      setInspectionNotes("");
      setRejectionReason("");
      setHumanCertified(false);
      // Refresh batch and history
      await fetchBatchDetail();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setSubmitError(`Backend Validation Failed (${err.statusCode}): ${err.message}`);
      } else {
        setSubmitError(err.message || "Failed to submit inspection decision");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Batch</h2>
        <p className="text-sm text-slate-600">{error || "Batch details are unavailable."}</p>
        <div className="pt-2">
          <Link
            href="/inspector/queue"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Inspection Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  const { batch, inspections } = data;
  const isEligibleForInspection = ["pending_inspection", "hold"].includes(batch.status);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Navigation & Header */}
      <div className="space-y-2">
        <Link
          href="/inspector/queue"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inspection Queue</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {batch.batch_code}
              </span>
              <StatusBadge status={batch.status} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
              {batch.food_name}
            </h1>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            ID: {batch.id}
          </span>
        </div>
      </div>

      {/* SECTION 1: Batch Information Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-600" />
          <span>Batch Consignment Details</span>
        </h2>

        {batch.description && (
          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
            {batch.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Donor Organisation</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{batch.donor_name}</span>
            </div>
            {batch.donor_address && (
              <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{batch.donor_address}</span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Quantity & Units</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{batch.quantity} {batch.quantity_unit}</span>
              {batch.estimated_weight_kg && (
                <span className="text-slate-500 font-normal">({batch.estimated_weight_kg} kg est.)</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Storage Instructions</span>
            <p className="font-semibold text-slate-800">
              {batch.storage_instructions || "Standard ambient / dry storage"}
            </p>
          </div>

          {batch.prepared_at && (
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Preparation Timestamp</span>
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(batch.prepared_at).toLocaleString()}</span>
              </p>
            </div>
          )}

          {batch.best_before_at && (
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Best Before Deadline</span>
              <p className="font-bold text-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{new Date(batch.best_before_at).toLocaleString()}</span>
              </p>
            </div>
          )}

          {batch.pickup_deadline && (
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Pickup Deadline</span>
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(batch.pickup_deadline).toLocaleString()}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Inspection History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <span>Inspection Audit Trail ({inspections.length})</span>
          </h2>
        </div>

        {inspections.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No prior inspection records on this batch.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">This batch is awaiting initial sensory verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inspections.map((insp: InspectionRecord) => (
              <div
                key={insp.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={insp.decision} size="sm" />
                    <span className="font-bold text-slate-800">
                      Inspector: {insp.inspector_name || insp.inspector_id}
                    </span>
                    {insp.human_verified && (
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold">
                        Human Verified
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(insp.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-600">
                  {insp.temperature_c !== null && insp.temperature_c !== undefined && (
                    <div>
                      <span className="text-slate-400">Temp:</span>{" "}
                      <strong className="text-slate-800">{insp.temperature_c}°C</strong>
                    </div>
                  )}
                  {insp.packaging_condition && (
                    <div>
                      <span className="text-slate-400">Packaging:</span>{" "}
                      <strong className="text-slate-800">{insp.packaging_condition}</strong>
                    </div>
                  )}
                  {insp.appearance_condition && (
                    <div>
                      <span className="text-slate-400">Appearance:</span>{" "}
                      <strong className="text-slate-800">{insp.appearance_condition}</strong>
                    </div>
                  )}
                  {insp.odour_condition && (
                    <div>
                      <span className="text-slate-400">Odour:</span>{" "}
                      <strong className="text-slate-800">{insp.odour_condition}</strong>
                    </div>
                  )}
                </div>

                {insp.target_species && insp.target_species.length > 0 && (
                  <div className="text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-200">
                    <span className="font-bold">Target Species:</span>{" "}
                    {insp.target_species.join(", ")}
                  </div>
                )}

                {insp.rejection_reason && (
                  <div className="text-red-800 bg-red-50 p-2 rounded-lg border border-red-200">
                    <span className="font-bold">Rejection Reason:</span>{" "}
                    {insp.rejection_reason}
                  </div>
                )}

                {insp.inspection_notes && (
                  <p className="text-slate-700 italic bg-white p-2.5 rounded border border-slate-100">
                    &quot;{insp.inspection_notes}&quot;
                  </p>
                )}

                {insp.evidence_urls && insp.evidence_urls.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-slate-400 text-[11px]">Evidence:</span>
                    {insp.evidence_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-teal-700 underline hover:text-teal-900"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Document #{idx + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Perform Inspection Form */}
      {isEligibleForInspection ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-teal-300 rounded-2xl p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">
                Record Inspection Decision
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submit an authoritative human verification decision. The backend status trigger will execute immediately upon commit.
            </p>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Inspection Decision <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  decision === InspectionDecision.APPROVED_HUMAN
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={InspectionDecision.APPROVED_HUMAN}
                  checked={decision === InspectionDecision.APPROVED_HUMAN}
                  onChange={() => setDecision(InspectionDecision.APPROVED_HUMAN)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Approved for Human Consumption</span>
                  <span className="text-slate-500 leading-tight block mt-0.5">
                    Safe for recipient food banks, community kitchens, or direct distribution.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  decision === InspectionDecision.APPROVED_ANIMAL
                    ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={InspectionDecision.APPROVED_ANIMAL}
                  checked={decision === InspectionDecision.APPROVED_ANIMAL}
                  onChange={() => setDecision(InspectionDecision.APPROVED_ANIMAL)}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Approved for Animal-Appropriate Use</span>
                  <span className="text-slate-500 leading-tight block mt-0.5">
                    Requires selecting explicit target species. Never route spoiled or contaminated rations.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  decision === InspectionDecision.APPROVED_ORGANIC_WASTE
                    ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={InspectionDecision.APPROVED_ORGANIC_WASTE}
                  checked={decision === InspectionDecision.APPROVED_ORGANIC_WASTE}
                  onChange={() => setDecision(InspectionDecision.APPROVED_ORGANIC_WASTE)}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Approved for Organic Waste Processing</span>
                  <span className="text-slate-500 leading-tight block mt-0.5">
                    Unfit for consumption; routed strictly to anaerobic digestion or composting.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  decision === InspectionDecision.REQUIRES_REVIEW
                    ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={InspectionDecision.REQUIRES_REVIEW}
                  checked={decision === InspectionDecision.REQUIRES_REVIEW}
                  onChange={() => setDecision(InspectionDecision.REQUIRES_REVIEW)}
                  className="mt-0.5 text-orange-600 focus:ring-orange-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Requires Review (Safety Hold)</span>
                  <span className="text-slate-500 leading-tight block mt-0.5">
                    Places batch on HOLD pending lab sampling or senior supervisor verification.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition sm:col-span-2 ${
                  decision === InspectionDecision.REJECTED
                    ? "border-red-500 bg-red-50/60 ring-2 ring-red-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value={InspectionDecision.REJECTED}
                  checked={decision === InspectionDecision.REJECTED}
                  onChange={() => setDecision(InspectionDecision.REJECTED)}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Rejected (Safety Hazard / Contaminated)</span>
                  <span className="text-slate-500 leading-tight block mt-0.5">
                    Marks batch as REJECTED. Food cannot be distributed or processed. Rejection reason required.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Section: Animal Species Selection */}
          {decision === InspectionDecision.APPROVED_ANIMAL && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-teal-900">
                  Target Animal Species <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  Food safety rule: Animal suitability must be species-specific. Choose all applicable species.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ANIMAL_SPECIES_OPTIONS.map((item) => (
                  <label
                    key={item.value}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                      selectedSpecies.includes(item.value)
                        ? "bg-teal-600 text-white border-teal-600 font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecies.includes(item.value)}
                      onChange={() => handleSpeciesToggle(item.value)}
                      className="sr-only"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Section: Rejection Reason */}
          {decision === InspectionDecision.REJECTED && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-red-900">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify precise cause for rejection (e.g. cross-contamination, mold proliferation, off-odour, punctured hermetic seals)..."
                rows={3}
                maxLength={1000}
                required
                className="w-full text-xs p-3 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>
          )}

          {/* Sensory & Physical Observations */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Physical & Sensory Observations
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Observed Temperature (°C)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperatureC}
                  onChange={(e) => setTemperatureC(e.target.value)}
                  placeholder="e.g. 4.2"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>Packaging Condition</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={packagingCondition}
                  onChange={(e) => setPackagingCondition(e.target.value)}
                  placeholder="e.g. Intact food-grade sealed trays"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Visual Appearance</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={appearanceCondition}
                  onChange={(e) => setAppearanceCondition(e.target.value)}
                  placeholder="e.g. Normal colour, fresh texture, no mold"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <span>Odour Assessment</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={odourCondition}
                  onChange={(e) => setOdourCondition(e.target.value)}
                  placeholder="e.g. Clean, characteristic aroma, no sourness"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Handling & Transport Notes
              </label>
              <textarea
                value={handlingNotes}
                onChange={(e) => setHandlingNotes(e.target.value)}
                placeholder="Specific handling guidelines for volunteers (e.g. keep refrigerated at all times, do not stack more than 3 crates)..."
                rows={2}
                maxLength={1000}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>

          {/* Safety Checklist */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Quality & Safety Verification Checklist
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={checklist.visualContaminationClear}
                  onChange={(e) =>
                    setChecklist((c) => ({ ...c, visualContaminationClear: e.target.checked }))
                  }
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Visual hygiene & contamination check cleared</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={checklist.temperatureCompliant}
                  onChange={(e) =>
                    setChecklist((c) => ({ ...c, temperatureCompliant: e.target.checked }))
                  }
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Temperature complies with safety threshold</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={checklist.packagingIntact}
                  onChange={(e) =>
                    setChecklist((c) => ({ ...c, packagingIntact: e.target.checked }))
                  }
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Packaging seals verified and untampered</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70">
                <input
                  type="checkbox"
                  checked={checklist.odourCharacteristic}
                  onChange={(e) =>
                    setChecklist((c) => ({ ...c, odourCharacteristic: e.target.checked }))
                  }
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Odour is characteristic and acceptable</span>
              </label>
            </div>
          </div>

          {/* Evidence URLs */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Audit Evidence Documents (Optional)
              </label>
              <span className="text-[11px] text-slate-400">
                Storage upload integration in progress
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={newEvidenceUrl}
                onChange={(e) => setNewEvidenceUrl(e.target.value)}
                placeholder="https://storage.foodloop.org/evidence/cert-123.jpg"
                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddEvidence}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>
            {evidenceUrls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {evidenceUrls.map((url, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="truncate max-w-md font-mono text-[11px] text-slate-600">
                      {url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(i)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspection Summary Notes */}
          <div className="space-y-1 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              5. Final Certification Summary Notes
            </label>
            <textarea
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Detailed findings and observations for this inspection record..."
              rows={3}
              maxLength={1000}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          {/* Mandatory Human Signoff Checkbox */}
          <div className="p-4 bg-teal-50/70 border border-teal-300 rounded-xl space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={humanCertified}
                onChange={(e) => setHumanCertified(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-800 leading-snug">
                <span className="font-bold text-teal-900 block">
                  Mandatory Human Certification & Governance Sign-off
                </span>
                <span>
                  I certify as a qualified human food safety inspector that I have conducted the required sensory/physical inspection according to safety standards. I confirm that this decision is not automated, and that food suitability conforms strictly to the selected classification.
                </span>
              </div>
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              href="/inspector/queue"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !humanCertified}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? "Committing to SafeChain..." : "Commit Inspection Decision"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
          <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">
            Batch Is Not Eligible for Further Quality Inspection
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This consignment is currently in status <strong className="uppercase">{batch.status}</strong>. Only batches on <strong>pending_inspection</strong> or <strong>hold</strong> can receive inspection submissions.
          </p>
        </div>
      )}
    </div>
  );
}
