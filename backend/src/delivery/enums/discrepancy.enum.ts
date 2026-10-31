export enum DiscrepancyType {
  SHORT_PICKUP = 'short_pickup',
  EXCESS_PICKUP = 'excess_pickup',
  DAMAGED_IN_TRANSIT = 'damaged_in_transit',
  MISSING_UNACCOUNTED = 'missing_unaccounted',
  PARTIAL_REJECTION = 'partial_rejection',
  TEMPERATURE_ABUSE = 'temperature_abuse',
  OTHER = 'other',
}

export enum DiscrepancyStatus {
  REPORTED = 'reported',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}
