import {
  OrganisationDocument,
} from '../entities/organisation-document.entity';
import { DocumentReviewStatus } from '../enums/verification-status.enum';

export interface IOrganisationDocumentRepository {
  createDocument(
    doc: Partial<OrganisationDocument>,
  ): Promise<OrganisationDocument>;
  findById(id: string): Promise<OrganisationDocument | null>;
  findByOrgId(organisationId: string): Promise<OrganisationDocument[]>;
  updateReviewStatus(
    id: string,
    status: DocumentReviewStatus,
    reviewedBy: string,
    reviewedAt: Date,
    reviewNotes?: string,
  ): Promise<OrganisationDocument>;
}

export const ORGANISATION_DOCUMENT_REPOSITORY = Symbol(
  'IOrganisationDocumentRepository',
);
