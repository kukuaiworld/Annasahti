import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IOrganisationDocumentRepository } from './organisation-document.repository.interface';
import {
  OrganisationDocument,
  DocumentType,
} from '../entities/organisation-document.entity';
import { DocumentReviewStatus } from '../enums/verification-status.enum';

@Injectable()
export class InMemoryOrganisationDocumentRepository
  implements IOrganisationDocumentRepository
{
  private readonly documents = new Map<string, OrganisationDocument>();

  async createDocument(
    doc: Partial<OrganisationDocument>,
  ): Promise<OrganisationDocument> {
    const id = doc.id || randomUUID();
    const entity: OrganisationDocument = {
      id,
      organisationId: doc.organisationId!,
      documentType: doc.documentType || DocumentType.OTHER,
      storagePath: doc.storagePath!,
      originalFilename: doc.originalFilename!,
      mimeType: doc.mimeType!,
      fileSizeBytes: doc.fileSizeBytes!,
      submittedBy: doc.submittedBy!,
      submittedAt: new Date(),
      reviewStatus: doc.reviewStatus || DocumentReviewStatus.PENDING,
      reviewedBy: doc.reviewedBy,
      reviewedAt: doc.reviewedAt,
      reviewNotes: doc.reviewNotes,
    };
    this.documents.set(id, entity);
    return { ...entity };
  }

  async findById(id: string): Promise<OrganisationDocument | null> {
    const doc = this.documents.get(id);
    return doc ? { ...doc } : null;
  }

  async findByOrgId(organisationId: string): Promise<OrganisationDocument[]> {
    const result: OrganisationDocument[] = [];
    for (const doc of this.documents.values()) {
      if (doc.organisationId === organisationId) {
        result.push({ ...doc });
      }
    }
    return result;
  }

  async updateReviewStatus(
    id: string,
    status: DocumentReviewStatus,
    reviewedBy: string,
    reviewedAt: Date,
    reviewNotes?: string,
  ): Promise<OrganisationDocument> {
    const doc = this.documents.get(id);
    if (!doc) {
      throw new Error(`Document ${id} not found`);
    }

    const updated: OrganisationDocument = {
      ...doc,
      reviewStatus: status,
      reviewedBy,
      reviewedAt,
      reviewNotes,
    };
    this.documents.set(id, updated);
    return { ...updated };
  }

  clear(): void {
    this.documents.clear();
  }
}
