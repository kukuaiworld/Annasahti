/**
 * Matches database enum public.verification_status exactly:
 * ('pending', 'verified', 'rejected', 'suspended')
 */
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

/**
 * Granular document verification status
 */
export enum DocumentReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RESUBMISSION_REQUIRED = 'resubmission_required',
}
