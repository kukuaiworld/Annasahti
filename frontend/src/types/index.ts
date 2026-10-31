export * from './auth';
export * from './api';
export * from './batches';
export * from './inspections';
export * from './matching';
export * from './allocations';
export * from './deliveries';

export type Role =
  | "donor"
  | "volunteer"
  | "recipient"
  | "animal-welfare"
  | "processor"
  | "admin";

export type FoodType =
  | "cooked_meals"
  | "raw_produce"
  | "bakery_dairy"
  | "packaged_goods"
  | "beverages"
  | "perishable_mix";

export type FoodSafetyTier =
  | "tier1_human_immediate" // Safe for direct human consumption (within 3-4 hours)
  | "tier2_human_prep"      // Fresh produce/packaged, safe for kitchen cooking
  | "tier3_animal_feed"     // Safe for cattle/poultry/dogs, not for humans
  | "tier4_compost_biofuel"; // Decomposed, strictly for industrial compost/biogas

export type DonationStatus =
  | "posted"
  | "matched"
  | "inspected"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "diverted"
  | "cancelled";

export interface FoodItem {
  id: string;
  name: string;
  category: FoodType;
  quantityKg: number;
  servings: number;
  preparationTime?: string;
  expiryTime: string;
  dietaryType: "veg" | "non-veg" | "vegan" | "egg";
  allergens: string[];
  temperatureType: "hot" | "ambient" | "chilled" | "frozen";
}

export interface FoodSafetyInspection {
  id: string;
  donationId: string;
  inspectorName: string;
  inspectionDate: string;
  visualCheckPassed: boolean;
  smellCheckPassed: boolean;
  packagingIntact: boolean;
  storageTempCelsius: number;
  phLevel?: number;
  assignedTier: FoodSafetyTier;
  notes: string;
  digitalSignature: string;
}

export interface Donation {
  id: string;
  trackingCode: string; // e.g. AS-2026-8942
  donorId: string;
  donorName: string;
  donorType: "restaurant" | "hotel" | "corporate_cafeteria" | "wedding_caterer" | "supermarket";
  location: string;
  pincode: string;
  contactPhone: string;
  foodItems: FoodItem[];
  totalKg: number;
  estimatedServings: number;
  pickupWindow: {
    start: string;
    end: string;
  };
  specialInstructions?: string;
  status: DonationStatus;
  createdAt: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignedRecipientId?: string;
  assignedRecipientName?: string;
  inspection?: FoodSafetyInspection;
  qrCodeUrl?: string;
  co2SavedKg: number;
  waterSavedLitres: number;
}

export interface RecipientRequest {
  id: string;
  recipientId: string;
  organizationName: string;
  organizationType: "orphanage" | "old_age_home" | "slum_community" | "night_shelter" | "school";
  requiredServings: number;
  urgencyLevel: "critical" | "high" | "moderate";
  dietaryPreference: "veg_only" | "all";
  location: string;
  distanceKm: number;
  status: "pending" | "matched" | "fulfilled" | "expired";
  createdAt: string;
  matchedDonationId?: string;
}

export interface AnimalFeedLog {
  id: string;
  shelterId: string;
  shelterName: string;
  animalType: "cattle" | "dogs_cats" | "poultry" | "sanctuary_wildlife";
  feedBatchId: string;
  quantityKg: number;
  dateReceived: string;
  safetyCheck: "certified_safe_feed" | "processed_feed";
  notes: string;
}

export interface ProcessorBatch {
  id: string;
  facilityName: string;
  facilityType: "biogas_plant" | "vermicompost_unit" | "animal_feed_mill";
  batchCode: string;
  inputFeedstockKg: number;
  processType: "anaerobic_digestion" | "aerobic_composting" | "pelletizing";
  outputEnergyKwh?: number;
  outputCompostKg?: number;
  status: "in_fermentation" | "curing" | "ready" | "dispatched";
  startDate: string;
  completionDate: string;
}

export interface VolunteerTask {
  id: string;
  title: string;
  donationId: string;
  donorName: string;
  donorAddress: string;
  recipientName: string;
  recipientAddress: string;
  totalKg: number;
  servings: number;
  etaMinutes: number;
  status: "assigned" | "arrived_pickup" | "inspected" | "en_route" | "delivered";
  distanceKm: number;
  rewardPoints: number;
  routeStops: {
    order: number;
    title: string;
    type: "pickup" | "dropoff" | "animal_shelter" | "processing";
    address: string;
    completed: boolean;
  }[];
}

export interface VolunteerUser {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  city: string;
  vehicleType: "e-rickshaw" | "bike_insulated_bag" | "van" | "mini_truck";
  rating: number;
  missionsCompleted: number;
  kgDelivered: number;
  points: number;
  rank: number;
  badges: {
    id: string;
    title: string;
    icon: string;
    dateEarned: string;
  }[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization?: string;
  phone: string;
  city: string;
  verificationStatus: "verified" | "pending" | "rejected";
  fssaiNumber?: string;
  joinedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  details: string;
  ipAddress: string;
}
