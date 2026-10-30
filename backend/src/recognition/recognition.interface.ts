export interface VolunteerStats {
  completedDeliveries: number;
  totalFoodRescuedKg: number;
  volunteerHours: number;
  activeDeliveries: number;
}

export interface VolunteerProfile {
  id: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  privacySettings: {
    showFullNameOnLeaderboard: boolean;
    showMetricsPublicly: boolean;
  };
  stats: VolunteerStats;
  earnedBadgesCount: number;
  certificatesCount: number;
  joinedAt: string;
}

export interface BadgeProgress {
  achievementCode: string;
  title: string;
  description: string;
  badgeIcon: string;
  category: string;
  thresholdType: string;
  thresholdValue: number;
  currentValue: number;
  percentage: number;
  isUnlocked: boolean;
  awardedAt?: string;
}

export interface CertificateRecord {
  id: string;
  volunteerId: string;
  volunteerName?: string;
  certificateCode: string;
  certificateType: string;
  title: string;
  issuedAt: string;
  issuedByName?: string;
  filePath?: string | null;
  isRevoked: boolean;
  revocationReason?: string | null;
}

export interface PublicCertificateVerification {
  isValid: boolean;
  certificateCode: string;
  title?: string;
  certificateType?: string;
  recipientName?: string; // Partial/anonymized name for privacy
  issuedAt?: string;
  status: 'valid' | 'revoked' | 'not_found';
  revocationReason?: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  volunteerId: string;
  displayName: string;
  avatarUrl: string | null;
  completedDeliveries: number;
  totalFoodRescuedKg: number;
  volunteerHours: number;
}

export interface VolunteerOfTheMonthRecord {
  id: string;
  recognitionPeriod: string; // 'YYYY-MM'
  volunteerId: string;
  volunteerName: string;
  avatarUrl: string | null;
  selectionNotes: string;
  metricsSnapshot: {
    deliveriesCount: number;
    rescuedKg: number;
  };
  selectedByName?: string;
  awardedAt: string;
}

export interface RewardItem {
  id: string;
  rewardCode: string;
  title: string;
  description: string;
  category: string;
  requiredAchievementCode: string | null;
  minDeliveriesRequired: number;
  stockQuantity: number;
  isEligible: boolean;
  hasRedeemed: boolean;
  redemptionStatus?: string | null;
}

export interface RewardRedemptionRecord {
  id: string;
  rewardId: string;
  rewardTitle: string;
  rewardCode: string;
  volunteerId: string;
  volunteerName: string;
  status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
  requestNotes?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewReason?: string;
  fulfillmentDetails?: string;
  createdAt: string;
  updatedAt: string;
}
