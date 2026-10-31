import { Donation, RecipientRequest, FoodSafetyInspection, FoodSafetyTier } from "../types";
import { storageService } from "./storageService";

export interface MatchResult {
  score: number; // 0 to 100
  distanceKm: number;
  dietaryMatch: boolean;
  servingsMatchPercentage: number;
  urgencyBoost: number;
  recommendedRecipientId: string;
  recommendedRecipientName: string;
}

export function calculateMatchScore(donation: Donation, request: RecipientRequest): MatchResult {
  // Distance factor (max 15km considered)
  const distance = request.distanceKm || 5.0;
  const distanceScore = Math.max(0, 100 - distance * 6); // 100 at 0km, 40 at 10km

  // Dietary factor
  const isDonationVeg = donation.foodItems.every((item) => item.dietaryType === "veg" || item.dietaryType === "vegan");
  let dietaryScore = 100;
  if (request.dietaryPreference === "veg_only" && !isDonationVeg) {
    dietaryScore = 0; // Incompatible
  }

  // Servings match (avoid excess surplus wastage)
  const ratio = Math.min(donation.estimatedServings / Math.max(request.requiredServings, 1), 1.5);
  const servingsScore = ratio >= 0.7 && ratio <= 1.3 ? 100 : 70;

  // Urgency boost
  let urgencyBonus = 0;
  if (request.urgencyLevel === "critical") urgencyBonus = 20;
  else if (request.urgencyLevel === "high") urgencyBonus = 10;

  const totalScore = dietaryScore === 0 ? 0 : Math.min(100, Math.round(distanceScore * 0.45 + servingsScore * 0.35 + urgencyBonus));

  return {
    score: totalScore,
    distanceKm: distance,
    dietaryMatch: dietaryScore > 0,
    servingsMatchPercentage: Math.round(ratio * 100),
    urgencyBoost: urgencyBonus,
    recommendedRecipientId: request.recipientId,
    recommendedRecipientName: request.organizationName,
  };
}

export function performAutoMatch(donationId: string): boolean {
  const donation = storageService.getDonationByCode(donationId);
  if (!donation || donation.status !== "posted") return false;

  const pendingRequests = storageService.getRequests().filter((r) => r.status === "pending");
  if (pendingRequests.length === 0) return false;

  let bestMatch: { request: RecipientRequest; score: number } | null = null;

  for (const req of pendingRequests) {
    const res = calculateMatchScore(donation, req);
    if (res.dietaryMatch && res.score > 60) {
      if (!bestMatch || res.score > bestMatch.score) {
        bestMatch = { request: req, score: res.score };
      }
    }
  }

  if (bestMatch) {
    storageService.updateDonation(donation.id, {
      status: "matched",
      assignedRecipientId: bestMatch.request.recipientId,
      assignedRecipientName: bestMatch.request.organizationName,
      assignedVolunteerName: "Aarav Sharma (Auto-Assigned Dispatch)",
    });

    storageService.updateRequest(bestMatch.request.id, {
      status: "matched",
      matchedDonationId: donation.id,
    });

    storageService.addAuditLog({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: "AnnaSathi AI Engine",
      role: "admin",
      action: "SMART_MATCH_DISPATCHED",
      details: `Matched ${donation.trackingCode} with ${bestMatch.request.organizationName} with confidence score ${bestMatch.score}%`,
      ipAddress: "127.0.0.1 (system)",
    });

    return true;
  }

  return false;
}

export function submitSafetyInspection(
  donationId: string,
  inspection: Omit<FoodSafetyInspection, "id" | "donationId" | "digitalSignature">
): FoodSafetyInspection {
  const donation = storageService.getDonationByCode(donationId);
  if (!donation) throw new Error("Donation not found");

  const fullInspection: FoodSafetyInspection = {
    ...inspection,
    id: "insp-" + Math.floor(100 + Math.random() * 900),
    donationId,
    digitalSignature: `SIG-FSSAI-${Math.floor(1000 + Math.random() * 9000)}-${inspection.assignedTier.toUpperCase()}`,
  };

  let newStatus = donation.status;
  if (inspection.assignedTier === "tier1_human_immediate" || inspection.assignedTier === "tier2_human_prep") {
    newStatus = "inspected";
  } else {
    // Tier 3 or Tier 4 diverted away from human consumption
    newStatus = "diverted";
  }

  storageService.updateDonation(donation.id, {
    inspection: fullInspection,
    status: newStatus,
  });

  storageService.addAuditLog({
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: inspection.inspectorName,
    role: "volunteer",
    action: "FOOD_INSPECTION_RECORDED",
    details: `Inspection on ${donation.trackingCode}: Assigned ${inspection.assignedTier}. Storage temp: ${inspection.storageTempCelsius}°C. Passed: ${inspection.visualCheckPassed && inspection.smellCheckPassed}`,
    ipAddress: "127.0.0.1",
  });

  return fullInspection;
}
