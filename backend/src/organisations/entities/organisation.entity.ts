import { OrganisationType } from '../enums/organisation-type.enum';
import { VerificationStatus } from '../enums/verification-status.enum';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface DayOperatingHours {
  open?: string;  // e.g. "09:00" (HH:mm in 24h format)
  close?: string; // e.g. "18:00"
  closed?: boolean;
}

export interface OperatingHours {
  timezone: string; // e.g. "Asia/Kolkata", "UTC"
  monday?: DayOperatingHours;
  tuesday?: DayOperatingHours;
  wednesday?: DayOperatingHours;
  thursday?: DayOperatingHours;
  friday?: DayOperatingHours;
  saturday?: DayOperatingHours;
  sunday?: DayOperatingHours;
}

export class Organisation {
  id: string;
  name: string;
  organisationType: OrganisationType;
  verificationStatus: VerificationStatus;
  description?: string;
  address?: string;
  location?: LocationCoordinates;
  contactEmail?: string;
  contactPhone?: string;
  operatingHours: OperatingHours;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
