import { DocumentReviewStatus } from '../enums/verification-status.enum';

export enum DocumentType {
  FOOD_SAFETY_CERTIFICATE = 'food_safety_certificate',
  BUSINESS_REGISTRATION = 'business_registration',
  TAX_EXEMPTION_80G = 'tax_exemption_80g',
  NGO_DARPAN = 'ngo_darpan',
  ANIMAL_WELFARE_BOARD = 'animal_welfare_board',
  WASTE_MANAGEMENT_LICENSE = 'waste_management_license',
  GOVERNMENT_ID = 'government_id',
  OTHER = 'other',
}

export class OrganisationDocument {
  id: string;
  organisationId: string;
  documentType: DocumentType;
  storagePath: string; // Private object key/path (never publicly accessible)
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  submittedBy: string;
  submittedAt: Date;
  reviewStatus: DocumentReviewStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}
